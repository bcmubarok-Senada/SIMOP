import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, RoleType, NotificationItem } from '../types';
import { storageService, initializeDatabase } from '../services/storage';
import { verifyPassword } from '../utils/crypto';
import { isAdminRole } from '../utils/constants';
import { securityService } from '../services/security';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentRoute: string;
  setCurrentRoute: (route: string) => void;
  login: (identifier: string, pass: string, rememberMe: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUserRole: (userId: string) => void;
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  updateUserProfile: (updates: Partial<User>) => void;
  refreshData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_SESSION_KEY = 'simop_auth_session_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentRoute, setCurrentRouteState] = useState<string>('dashboard');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Initialize DB and load session on mount
  useEffect(() => {
    async function init() {
      try {
        await initializeDatabase();
        const savedSession = localStorage.getItem(AUTH_SESSION_KEY) || sessionStorage.getItem(AUTH_SESSION_KEY);
        if (savedSession) {
          const user = storageService.getUserById(savedSession);
          if (user && user.status === 'Aktif') {
            setCurrentUser(user);
          } else {
            localStorage.removeItem(AUTH_SESSION_KEY);
            sessionStorage.removeItem(AUTH_SESSION_KEY);
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Update notifications whenever currentUser or refresh changes
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const allNotifs = storageService.getNotifications();
    const isAdmin = isAdminRole(currentUser.role);

    const filtered = allNotifs.filter(n => {
      if (n.recipientUserId && n.recipientUserId === currentUser.id) return true;
      if (n.targetRole === 'ALL') return true;
      if (isAdmin && (n.targetRole === 'ADMIN' || n.targetRole === 'KOORDINATOR' || n.targetRole === 'TL')) return true;
      if (n.targetRole === currentUser.role) return true;
      return false;
    });

    setNotifications(filtered);
  }, [currentUser, refreshTrigger]);

  // Real-time synchronization listener (lintas laptop, PC, browser, dan tab)
  useEffect(() => {
    const handleCloudSync = () => {
      setRefreshTrigger(prev => prev + 1);
      if (currentUser) {
        const fresh = storageService.getUserById(currentUser.id);
        if (fresh && fresh.status === 'Nonaktif') {
          logout();
          addToast('Sesi berakhir: Akun dinonaktifkan oleh Administrator.', 'warning');
        } else if (fresh) {
          setCurrentUser(fresh);
        }
      }
    };

    window.addEventListener('simop_cloud_sync', handleCloudSync);
    return () => window.removeEventListener('simop_cloud_sync', handleCloudSync);
  }, [currentUser]);

  const login = async (identifier: string, pass: string, rememberMe: boolean): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      // 1. Cek proteksi brute-force / rate limit
      const rateCheck = securityService.checkLoginRateLimit(identifier);
      if (!rateCheck.allowed) {
        return {
          success: false,
          error: `Terlalu banyak percobaan gagal. Akun dikunci sementara demi keamanan selama ${rateCheck.remainingLockoutSeconds} detik.`,
        };
      }

      // 2. Sanitasi input kredensial (anti-injection & anti-XSS)
      const cleanIdentifier = securityService.sanitizeInput(identifier);
      const user = storageService.getUserByNppOrEmail(cleanIdentifier);
      if (!user) {
        const attempt = securityService.recordFailedLogin(identifier);
        if (attempt.locked) {
          return {
            success: false,
            error: 'Terlalu banyak percobaan gagal. Akses diblokir sementara demi keamanan sistem (15 menit).',
          };
        }
        return {
          success: false,
          error: `Email atau NPP tidak ditemukan. Sisa percobaan: ${attempt.remainingAttempts}x.`,
        };
      }

      if (user.status === 'Nonaktif') {
        return { success: false, error: 'Akun Anda telah dinonaktifkan. Hubungi Administrator.' };
      }

      const isValid = await verifyPassword(pass.trim(), user.salt, user.passwordHash);
      if (!isValid) {
        const attempt = securityService.recordFailedLogin(identifier);
        storageService.addAuditLog({
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          action: 'Percobaan Login Gagal (Password Salah)',
          module: 'Autentikasi',
          notes: `Gagal login. Sisa percobaan aman: ${attempt.remainingAttempts}x`,
        });

        if (attempt.locked) {
          return {
            success: false,
            error: 'Terlalu banyak percobaan gagal. Akses diblokir sementara demi keamanan sistem (15 menit).',
          };
        }
        return {
          success: false,
          error: `Password yang Anda masukkan salah. Sisa percobaan: ${attempt.remainingAttempts}x.`,
        };
      }

      // Login berhasil: reset rate limiter
      securityService.resetLoginRateLimit(identifier);

      setCurrentUser(user);
      if (rememberMe) {
        localStorage.setItem(AUTH_SESSION_KEY, user.id);
      } else {
        sessionStorage.setItem(AUTH_SESSION_KEY, user.id);
      }

      // Record access and operational utilization
      storageService.recordUserAccess(user.npp || identifier, true);

      // Log audit
      storageService.addAuditLog({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'Login Berhasil',
        module: 'Autentikasi',
        notes: `Login sukses via NPP/Email: ${cleanIdentifier}`,
      });

      addToast(`Selamat datang kembali, ${user.name}!`, 'success');
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Terjadi kesalahan sistem saat proses login.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (currentUser) {
      storageService.addAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'Logout',
        module: 'Autentikasi',
      });
    }
    setCurrentUser(null);
    localStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    setCurrentRouteState('dashboard');
    addToast('Anda telah berhasil logout.', 'info');
  };

  // Quick switch for tester & reviewer convenience
  const switchUserRole = (userId: string) => {
    const user = storageService.getUserById(userId);
    if (user && user.status === 'Aktif') {
      setCurrentUser(user);
      localStorage.setItem(AUTH_SESSION_KEY, user.id);
      setCurrentRouteState('dashboard');
      addToast(`Beralih ke akun: ${user.name} (${user.role})`, 'info');
    }
  };

  const markNotificationAsRead = (id: string) => {
    const allNotifs = storageService.getNotifications();
    const updated = allNotifs.map(n => n.id === id ? { ...n, read: true } : n);
    storageService.saveNotifications(updated);
    refreshData();
  };

  const markAllNotificationsAsRead = () => {
    const allNotifs = storageService.getNotifications();
    const updated = allNotifs.map(n => ({ ...n, read: true }));
    storageService.saveNotifications(updated);
    refreshData();
    addToast('Semua notifikasi telah ditandai dibaca.', 'info');
  };

  // Navigation handler supporting both public and authenticated users
  const setCurrentRoute = (route: string) => {
    setCurrentRouteState(route);
  };

  const updateUserProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    storageService.saveUser(updatedUser);
    setCurrentUser(updatedUser);
    refreshData();
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        currentRoute,
        setCurrentRoute,
        login,
        logout,
        switchUserRole,
        toasts,
        addToast,
        removeToast,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        updateUserProfile,
        refreshData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
