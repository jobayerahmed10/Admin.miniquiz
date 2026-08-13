import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AddAiQuestionsModal } from './components/AddAiQuestionsModal';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ExamsManagement } from './pages/ExamsManagement';
import { CoursesManagement } from './pages/CoursesManagement';
import { QuestionsList } from './pages/QuestionsList';
import { CreateQuestion } from './pages/CreateQuestion';
import { EditQuestion } from './pages/EditQuestion';
import { getSupabaseClient, fetchDashboardStats } from './lib/supabase';

interface AdminContextType {
  onOpenAiModal: () => void;
}

export function useAdminContext() {
  return useOutletContext<AdminContextType>();
}

// Protected Layout component wrapping admin routes
const AdminLayout: React.FC<{
  isAuthenticated: boolean;
  onLogout: () => void;
  userEmail?: string;
}> = ({ isAuthenticated, onLogout, userEmail }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [stats, setStats] = useState({ questionsCount: 30, examsCount: 2 });

  useEffect(() => {
    const loadStats = async () => {
      const { stats: fetchedStats } = await fetchDashboardStats();
      if (fetchedStats) {
        setStats({
          questionsCount: fetchedStats.totalQuestions || 30,
          examsCount: fetchedStats.totalExams || 2,
        });
      }
    };
    loadStats();
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleOpenAiModal = () => {
    setAiModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenAiModal={handleOpenAiModal}
        questionsCount={stats.questionsCount}
        examsCount={stats.examsCount}
      />

      {/* Main Container Area - shifted when sidebar is open */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:pl-72' : 'lg:pl-0'}`}>
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={onLogout}
          userEmail={userEmail}
        />

        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 pb-12">
          <Outlet context={{ onOpenAiModal: handleOpenAiModal }} />
        </main>

        <footer className="border-t border-slate-800/80 bg-[#060911] py-4 text-center text-xs text-slate-500 font-medium">
          তামরীন একাডেমি এডমিন সিএমএস v2.5 &bull; NTRCA Cadre Special Admin Panel &bull; Supabase Backend Connected
        </footer>
      </div>

      {/* Global AI Questions Hub Modal */}
      <AddAiQuestionsModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onQuestionsSaved={() => {
          setAiModalOpen(false);
          fetchDashboardStats().then(({ stats: fetchedStats }) => {
            if (fetchedStats) {
              setStats({
                questionsCount: fetchedStats.totalQuestions || 30,
                examsCount: fetchedStats.totalExams || 2,
              });
            }
          });
          window.dispatchEvent(new CustomEvent('questions_updated'));
        }}
      />
    </div>
  );
};

// Wrapper for Dashboard page to consume admin context
const DashboardRoute: React.FC = () => {
  const { onOpenAiModal } = useAdminContext();
  return <Dashboard onOpenAiModal={onOpenAiModal} />;
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check Supabase Auth Session
    const checkSession = async () => {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data } = await client.auth.getSession();
          if (data?.session) {
            setSession(data.session);
          } else {
            // Check fallback session in localStorage if testing
            const local = localStorage.getItem('miniquiz_admin_session');
            if (local) {
              setSession(JSON.parse(local));
            }
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        const local = localStorage.getItem('miniquiz_admin_session');
        if (local) {
          setSession(JSON.parse(local));
        }
      }
      setCheckingAuth(false);
    };

    checkSession();
  }, []);

  const handleLoginSuccess = (userSession: any) => {
    setSession(userSession);
    localStorage.setItem('miniquiz_admin_session', JSON.stringify(userSession));
  };

  const handleLogout = async () => {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (e) {
        console.error(e);
      }
    }
    setSession(null);
    localStorage.removeItem('miniquiz_admin_session');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-mono">তামরীন একাডেমি এডমিন লোড হচ্ছে...</p>
      </div>
    );
  }

  const isAuthenticated = Boolean(session);

  return (
    <BrowserRouter>
      <Routes>
        {/* Login Route */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/admin" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* Protected Admin Routes */}
        <Route
          element={
            <AdminLayout
              isAuthenticated={isAuthenticated}
              onLogout={handleLogout}
              userEmail={session?.user?.email}
            />
          }
        >
          <Route path="/admin" element={<DashboardRoute />} />
          <Route path="/admin/exams" element={<ExamsManagement />} />
          <Route path="/admin/courses" element={<CoursesManagement />} />
          <Route path="/admin/questions" element={<QuestionsList />} />
          <Route path="/admin/questions/create" element={<CreateQuestion />} />
          <Route path="/admin/questions/edit/:id" element={<EditQuestion />} />
        </Route>

        {/* Root fallback */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? '/admin' : '/login'} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
