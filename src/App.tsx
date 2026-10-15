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

const MainLayout: React.FC = () => {
  const { currentUser, currentRoute, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 animate-pulse mb-3">
          <span className="font-extrabold text-base">SO</span>
        </div>
        <p className="text-xs font-semibold text-slate-500">Memuat Sistem Operasional...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  const isAdmin = isAdminRole(currentUser.role);
  const isPetugas = currentUser.role === 'PETUGAS';

  // Render content based on current active route and role permissions
  const renderContent = () => {
    switch (currentRoute) {
      case 'dashboard':
        return isAdmin ? <AdminDashboard /> : <UserDashboard />;

      case 'users':
        return isAdmin ? <UserManagement /> : <UserDashboard />;

      case 'schedules':
        return <ScheduleGrid />;

      case 'approvals':
        return <ApprovalManagement />;

      case 'senada':
        // Senada is available for Admin and Petugas (QA hidden per user requirements)
        if (isAdmin || isPetugas) {
          return <SenadaManagement />;
        }
        return <UserDashboard />;

      case 'exams':
        return <ExamList />;

      case 'bank-soal':
        return isAdmin ? <QuestionBank /> : <ExamList />;

      case 'leaderboard':
        return <Leaderboard />;

      case 'online-class':
        return <OnlineClassroom />;

      case 'reports':
        return <ReportsPage />;

      case 'audit':
        return isAdmin ? <AuditLogPage /> : <UserDashboard />;

      case 'settings':
        return isAdmin ? <SettingsPage /> : <UserDashboard />;

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
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Navbar onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>
      </div>

      {/* Global Floating Toast Notifications */}
      <ToastContainer />
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
