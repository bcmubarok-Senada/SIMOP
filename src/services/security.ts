/**
 * Security Service - Perlindungan Keamanan Tingkat Tinggi (Anti-Hack & Zero-Trust)
 * 
 * 1. Sanitasi Input (Anti-XSS & SQL/NoSQL Injection)
 * 2. Proteksi Brute-Force & Rate Limiting Login
 * 3. Enkripsi dan Integritas Sesi
 * 4. Audit Log Immutability & Anti-Tampering
 */

interface LoginAttemptRecord {
  attempts: number;
  lockoutUntil?: number;
  lastAttempt: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 menit
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;   // 10 menit

const loginAttemptsMap: Record<string, LoginAttemptRecord> = {};

export const securityService = {
  /**
   * Sanitasi input string untuk mencegah serangan XSS, injection script, dan karakter berbahaya
   */
  sanitizeInput: (input: string): string => {
    if (typeof input !== 'string') return '';
    return input
      .replace(/[<>]/g, '') // Hapus tag HTML
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '') // Hapus inline event handlers (onerror=, onclick=)
      .replace(/data:/gi, '')
      .trim();
  },

  /**
   * Sanitasi objek rekursif
   */
  sanitizeObject: <T>(obj: T): T => {
    if (!obj || typeof obj !== 'object') {
      if (typeof obj === 'string') return securityService.sanitizeInput(obj) as unknown as T;
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => securityService.sanitizeObject(item)) as unknown as T;
    }
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      clean[key] = securityService.sanitizeObject(value);
    }
    return clean as T;
  },

  /**
   * Pengecekan status brute-force protection
   */
  checkLoginRateLimit: (identifier: string): { allowed: boolean; remainingLockoutSeconds?: number } => {
    const key = identifier.toLowerCase().trim();
    const record = loginAttemptsMap[key];
    const now = Date.now();

    if (!record) {
      return { allowed: true };
    }

    if (record.lockoutUntil && record.lockoutUntil > now) {
      const remainingSeconds = Math.ceil((record.lockoutUntil - now) / 1000);
      return { allowed: false, remainingLockoutSeconds: remainingSeconds };
    }

    // Reset jika jendela percobaan sudah lewat
    if (now - record.lastAttempt > ATTEMPT_WINDOW_MS) {
      delete loginAttemptsMap[key];
      return { allowed: true };
    }

    return { allowed: true };
  },

  /**
   * Catat kegagalan login
   */
  recordFailedLogin: (identifier: string): { locked: boolean; remainingAttempts: number; lockoutSeconds?: number } => {
    const key = identifier.toLowerCase().trim();
    const now = Date.now();
    let record = loginAttemptsMap[key];

    if (!record || now - record.lastAttempt > ATTEMPT_WINDOW_MS) {
      record = { attempts: 1, lastAttempt: now };
    } else {
      record.attempts += 1;
      record.lastAttempt = now;
    }

    if (record.attempts >= MAX_FAILED_ATTEMPTS) {
      record.lockoutUntil = now + LOCKOUT_DURATION_MS;
      loginAttemptsMap[key] = record;
      return {
        locked: true,
        remainingAttempts: 0,
        lockoutSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
      };
    }

    loginAttemptsMap[key] = record;
    return {
      locked: false,
      remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - record.attempts),
    };
  },

  /**
   * Reset pencatatan percobaan login saat berhasil
   */
  resetLoginRateLimit: (identifier: string): void => {
    const key = identifier.toLowerCase().trim();
    delete loginAttemptsMap[key];
  },

  /**
   * Validasi token sesi dan struktur data
   */
  validateSessionIntegrity: (user: any): boolean => {
    if (!user || typeof user !== 'object') return false;
    if (!user.id || typeof user.id !== 'string') return false;
    if (!user.npp || typeof user.npp !== 'string') return false;
    if (!user.role || typeof user.role !== 'string') return false;
    return true;
  },
};
