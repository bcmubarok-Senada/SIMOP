import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { UserManagement } from './components/users/UserManagement';
import { ScheduleGrid } from './components/schedules/ScheduleGrid';
import { ApprovalManagement } from './components/approvals/ApprovalManagement';
import { SenadaManagement } from './components/senada/SenadaManagement';
import { ExamList } from './components/exams/ExamList';
import { QuestionBank } from './components/exams/QuestionBank';
import { Leaderboard } from './components/exams/Leaderboard';
import { OnlineClassroom } from './components/exams/OnlineClassroom';
import { ReportsPage } from './components/reports/ReportsPage';
import { AuditLogPage } from './components/audit/AuditLogPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { ToastContainer } from './components/ui/ToastContainer';
import { isAdminRole } from './utils/constants';
import { AdminLoginModal } from './components/auth/AdminLoginModal';
import { Lock, ShieldCheck } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentUser, currentRoute, isLoading, setCurrentRoute } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 animate-pulse mb-3">
          <span className="font-extrabold text-base">SO</span>
        </div>
        <p className="text-xs font-semibold text-slate-500">Memuat Sistem Operasional SIMOP Terpadu...</p>
      </div>
    );
  }

  const isAdmin = currentUser ? isAdminRole(currentUser.role) : false;
  const isPetugas = currentUser?.role === 'PETUGAS';

  const AdminRequiredNotice = ({ pageTitle }: { pageTitle: string }) => (
    <div className="p-8 max-w-lg mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-sm text-center space-y-4 my-8">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
        <Lock className="w-7 h-7" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-800">Akses Terbatas: Administrator</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Halaman <strong>{pageTitle}</strong> hanya dapat diakses oleh Administrator dengan kredensial terverifikasi.
        </p>
      </div>
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setIsAdminLoginModalOpen(true)}
          className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Masuk Sebagai Admin</span>
        </button>
        <button
          type="button"
          onClick={() => setCurrentRoute('dashboard')}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
        >
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );

  // Render content based on current active route and role permissions
  const renderContent = () => {
    switch (currentRoute) {
      case 'dashboard':
        return isAdmin ? <AdminDashboard /> : <UserDashboard />;

      case 'users':
        return isAdmin ? <UserManagement /> : <AdminRequiredNotice pageTitle="Manajemen User" />;

      case 'schedules':
        return <ScheduleGrid />;

      case 'approvals':
        return <ApprovalManagement />;

      case 'senada':
        return <SenadaManagement />;

      case 'exams':
        return <ExamList />;

      case 'bank-soal':
        return isAdmin ? <QuestionBank /> : <AdminRequiredNotice pageTitle="Bank Soal" />;

      case 'leaderboard':
        return <Leaderboard />;

      case 'online-class':
        return <OnlineClassroom />;

      case 'reports':
        return <ReportsPage />;

      case 'audit':
        return isAdmin ? <AuditLogPage /> : <AdminRequiredNotice pageTitle="Riwayat & Audit Log" />;

      case 'settings':
        return isAdmin ? <SettingsPage /> : <AdminRequiredNotice pageTitle="Pengaturan Sistem" />;

      default:
        return isAdmin ? <AdminDashboard /> : <UserDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Column */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        <Navbar onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>
      </div>

      {/* Global Floating Toast Notifications */}
      <ToastContainer />

      {/* Admin Login Modal for Restricted Operations */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
