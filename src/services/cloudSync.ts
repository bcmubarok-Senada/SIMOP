import { doc, setDoc, getDocs, collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

type SyncListener = (key: string) => void;

class CloudSyncService {
  private isListening = false;
  private listeners: Set<SyncListener> = new Set();
  private lastWrittenTimestamps: Record<string, string> = {};
  private isConnectedToCloud = false;

  /**
   * Status koneksi real-time ke cloud database
   */
  public isConnected(): boolean {
    return this.isConnectedToCloud;
  }

  /**
   * Daftarkan listener untuk mendeteksi pembaruan data real-time
   */
  public addListener(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public notifyListeners(key: string) {
    this.listeners.forEach(fn => {
      try {
        fn(key);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('simop_cloud_sync', { detail: { key } }));
    }
  }

  /**
   * Mengunduh seluruh data terbaru dari Google Cloud Firestore ke penyimpanan lokal
   * Mengembalikan true jika cloud memiliki data, false jika cloud kosong
   */
  public async fetchAndHydrateFromCloud(): Promise<boolean> {
    try {
      const syncColRef = collection(db, 'systemSync');
      const snapshot = await getDocs(syncColRef);

      if (snapshot.empty) {
        console.log('[CloudSync] Database cloud masih kosong.');
        return false;
      }

      console.log(`[CloudSync] Mengunduh ${snapshot.size} koleksi data dari Google Cloud Firestore...`);
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
      this.attachRealtimeListener();
      this.notifyListeners('*');
      return true;
    } catch (err) {
      console.warn('[CloudSync] Gagal mengunduh dari cloud, beralih ke cache lokal:', err);
      this.attachRealtimeListener();
      return false;
    }
  }

  /**
   * Memasang listener real-time (onSnapshot) lintas perangkat, server, dan IP
   */
  public attachRealtimeListener(): void {
    if (this.isListening) return;
    this.isListening = true;

    // 1. Sinkronisasi antar tab di browser lokal
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key && event.key.startsWith('simop_')) {
          this.notifyListeners(event.key);
        }
      });
    }

    // 2. Sinkronisasi real-time Google Cloud Firestore (lintas laptop, PC, dan IP)
    try {
      const syncColRef = collection(db, 'systemSync');
      onSnapshot(
        syncColRef,
        (snap) => {
          this.isConnectedToCloud = true;
          snap.docChanges().forEach(change => {
            if (change.type === 'added' || change.type === 'modified') {
              const docData = change.doc.data();
              const key = docData.key;
              const remoteTimestamp = docData.updatedAt;

              // Lewati jika ini merupakan write dari perangkat ini sendiri
              if (this.lastWrittenTimestamps[key] && this.lastWrittenTimestamps[key] === remoteTimestamp) {
                return;
              }

              if (key && docData.payload) {
                try {
                  const currentLocal = localStorage.getItem(key);
                  if (currentLocal !== docData.payload) {
                    localStorage.setItem(key, docData.payload);
                    this.lastWrittenTimestamps[key] = remoteTimestamp;
                    console.log(`[CloudSync Realtime] Menerima pembaruan cloud: ${key}`);
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
      console.warn('[CloudSync] Gagal memasang realtime listener:', err);
    }
  }

  /**
   * Kirim perubahan data secara langsung ke Google Cloud Firestore
   */
  public async pushToCloud(key: string, data: any): Promise<void> {
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
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `systemSync/${key}`);
    }
  }
}

export const cloudSync = new CloudSyncService();
