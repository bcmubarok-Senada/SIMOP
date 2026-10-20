import { doc, setDoc, getDocs, collection, onSnapshot, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

type SyncListener = (key: string) => void;

class CloudSyncService {
  private isListening = false;
  private listeners: Set<SyncListener> = new Set();
  private lastWrittenTimestamps: Record<string, string> = {};
  private debounceTimers: Record<string, any> = {};
  private isConnectedToCloud = false;

  /**
   * Status koneksi real-time ke cloud database
   */
  public isConnected(): boolean {
    return this.isConnectedToCloud;
  }

  /**
   * Daftarkan listener untuk mendeteksi perubahan data dari cloud
   */
  public addListener(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(key: string) {
    this.listeners.forEach(fn => {
      try {
        fn(key);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });

    // Dispatch global window event untuk tab dan komponen React
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('simop_cloud_sync', { detail: { key } }));
    }
  }

  /**
   * Inisialisasi sinkronisasi cloud real-time:
   * - Mendengarkan perubahan data dari laptop/PC/browser lain via Firestore onSnapshot
   * - Mendengarkan perubahan antar tab lokal via window storage event
   * - Melakukan handshake awal mengunduh data cloud ke perangkat saat ini
   */
  public async initCloudSync(initialDataMap?: Record<string, any>): Promise<void> {
    if (this.isListening) return;
    this.isListening = true;

    // 1. Cross-tab synchronization (antar tab di browser yang sama)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key && event.key.startsWith('simop_')) {
          this.notifyListeners(event.key);
        }
      });
    }

    try {
      // 2. Initial fetch & bootstrap jika cloud kosong
      const syncColRef = collection(db, 'systemSync');
      const snapshot = await getDocs(syncColRef);

      if (snapshot.empty) {
        // Cloud baru dibuat: unggah initial data lokal ke cloud agar laptop/device lain dapat mengakses
        if (initialDataMap) {
          console.log('[CloudSync] Inisialisasi data awal ke Cloud Firestore...');
          for (const [key, val] of Object.entries(initialDataMap)) {
            await this.pushToCloud(key, val, true);
          }
        }
      } else {
        // Cloud memiliki data: sinkronkan ke local cache perangkat ini
        console.log('[CloudSync] Mengunduh data terbaru dari Cloud Firestore...');
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data && data.key && data.payload) {
            try {
              localStorage.setItem(data.key, data.payload);
              this.lastWrittenTimestamps[data.key] = data.updatedAt;
            } catch (err) {
              console.error('Error caching cloud sync data:', err);
            }
          }
        });
        this.isConnectedToCloud = true;
        this.notifyListeners('*');
      }

      // 3. Real-time onSnapshot listener (lintas laptop, PC, server, dan IP)
      onSnapshot(
        syncColRef,
        (snap) => {
          this.isConnectedToCloud = true;
          snap.docChanges().forEach(change => {
            if (change.type === 'added' || change.type === 'modified') {
              const docData = change.doc.data();
              const key = docData.key;
              const remoteTimestamp = docData.updatedAt;

              // Abaikan jika perubahan ini merupakan echo dari write perangkat ini
              if (this.lastWrittenTimestamps[key] && this.lastWrittenTimestamps[key] === remoteTimestamp) {
                return;
              }

              // Update local storage dengan data cloud terbaru
              if (key && docData.payload) {
                try {
                  const currentLocal = localStorage.getItem(key);
                  if (currentLocal !== docData.payload) {
                    localStorage.setItem(key, docData.payload);
                    this.lastWrittenTimestamps[key] = remoteTimestamp;
                    console.log(`[CloudSync] Data real-time diperbarui dari cloud: ${key}`);
                    this.notifyListeners(key);
                  }
                } catch (err) {
                  console.error('Error applying cloud sync update:', err);
                }
              }
            }
          });
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'systemSync');
        }
      );
    } catch (err) {
      console.warn('[CloudSync] Gagal inisialisasi cloud sync, menggunakan fallback lokal:', err);
    }
  }

  /**
   * Kirim perubahan data ke cloud secara real-time
   */
  public pushToCloud(key: string, data: any, immediate = false): Promise<void> {
    return new Promise((resolve) => {
      // Clear pending debounce for this key
      if (this.debounceTimers[key]) {
        clearTimeout(this.debounceTimers[key]);
      }

      const executePush = async () => {
        try {
          const timestamp = new Date().toISOString();
          const payloadString = typeof data === 'string' ? data : JSON.stringify(data);
          this.lastWrittenTimestamps[key] = timestamp;

          const docRef = doc(db, 'systemSync', key);
          await setDoc(docRef, {
            key,
            payload: payloadString,
            updatedAt: timestamp,
          });
          this.isConnectedToCloud = true;
          resolve();
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `systemSync/${key}`);
          resolve(); // Jangan halangi alur UI jika offline
        }
      };

      if (immediate) {
        executePush();
      } else {
        // Debounce 150ms agar input tidak membanjiri jaringan
        this.debounceTimers[key] = setTimeout(executePush, 150);
      }
    });
  }
}

export const cloudSync = new CloudSyncService();
