import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AddAiQuestionsModal } from './components/AddAiQuestionsModal';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ExamsManagement } from './pages/ExamsManagement';
import { CoursesManagement } from './pages/CoursesManagement';
import { EnrollmentsManagement } from './pages/EnrollmentsManagement';
import { QuestionsList } from './pages/QuestionsList';
import { CreateQuestion } from './pages/CreateQuestion';
import { EditQuestion } from './pages/EditQuestion';
import { StudentsManagement } from './pages/StudentsManagement';
import { SubjectPostsManagement } from './pages/SubjectPostsManagement';
import { QuestionReportsManagement } from './pages/QuestionReportsManagement';
import { CreateBlog } from './pages/CreateBlog';
import { BlogsManagement } from './pages/BlogsManagement';
import { StudentApp } from './pages/StudentApp';
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
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : true));
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [stats, setStats] = useState({ questionsCount: 0, examsCount: 0 });

  const loadStats = async () => {
    const { stats: fetchedStats } = await fetchDashboardStats();
    if (fetchedStats) {
      setStats({
        questionsCount: fetchedStats.totalQuestions ?? 0,
        examsCount: fetchedStats.totalExams ?? 0,
      });
    }
  };

  useEffect(() => {
    loadStats();

    const handleUpdated = () => {
      loadStats();
    };
    window.addEventListener('questions_updated', handleUpdated);
    return () => {
      window.removeEventListener('questions_updated', handleUpdated);
    };
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleOpenAiModal = () => {
    setAiModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-800 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-slate-950 transition-colors duration-200">
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

        <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#060911] py-4 text-center text-xs text-slate-500 dark:text-slate-400 font-medium transition-colors duration-200">
          তামরীন একাডেমি এডমিন সিএমএস v2.5 &bull; NTRCA Cadre Special Admin Panel &bull; Supabase Backend Connected
        </footer>
      </div>

      {/* Global AI Questions Hub Modal */}
      <AddAiQuestionsModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onQuestionsSaved={() => {
          setAiModalOpen(false);
          loadStats();
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
    let isMounted = true;

    // Check Supabase Auth Session with timeout protection for mobile data
    const checkSession = async () => {
      // Check cached session in localStorage first for instantaneous startup on mobile
      const local = localStorage.getItem('miniquiz_admin_session');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (isMounted) setSession(parsed);
        } catch (e) {
          console.error(e);
        }
      }

      const client = getSupabaseClient();
      if (client) {
        try {
          // Race getSession with a 2.5s timeout so mobile networks don't hang indefinitely
          const sessionPromise = client.auth.getSession();
          const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
            setTimeout(() => resolve({ data: { session: null } }), 2500)
          );

          const result: any = await Promise.race([sessionPromise, timeoutPromise]);
          if (result?.data?.session && isMounted) {
            setSession(result.data.session);
            localStorage.setItem('miniquiz_admin_session', JSON.stringify(result.data.session));
          }
        } catch (err) {
          console.error('Auth session error:', err);
        }

        // Also setup onAuthStateChange listener
        try {
          const { data: authListener } = client.auth.onAuthStateChange((_event, newSession) => {
            if (isMounted) {
              if (newSession) {
                setSession(newSession);
                localStorage.setItem('miniquiz_admin_session', JSON.stringify(newSession));
              } else if (!localStorage.getItem('miniquiz_admin_session')) {
                setSession(null);
              }
            }
          });

          return () => {
            authListener?.subscription?.unsubscribe();
          };
        } catch (e) {
          console.error('Auth listener setup error:', e);
        }
      }

      if (isMounted) {
        setCheckingAuth(false);
      }
    };

    checkSession();

    // Fallback safety timer ensuring spinner never hangs longer than 3 seconds
    const fallbackTimer = setTimeout(() => {
      if (isMounted) setCheckingAuth(false);
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
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
        {/* Root Route -> Redirect to /admin if logged in, else /login */}
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? '/admin' : '/login'} replace />}
        />

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

        {/* Student App Portal (Mobile Friendly, No login screen bottom buttons, Study Growth Dashboard) */}
        <Route path="/app" element={<StudentApp />} />
        <Route path="/student" element={<StudentApp />} />

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
          <Route path="/admin/subject-posts" element={<SubjectPostsManagement />} />
          <Route path="/admin/courses" element={<CoursesManagement />} />
          <Route path="/admin/enrollments" element={<EnrollmentsManagement />} />
          <Route path="/admin/students" element={<StudentsManagement />} />
          <Route path="/admin/questions" element={<QuestionsList />} />
          <Route path="/admin/reports" element={<QuestionReportsManagement />} />
          <Route path="/admin/create-blog" element={<CreateBlog />} />
          <Route path="/admin/create-blog/edit/:id" element={<CreateBlog />} />
          <Route path="/admin/blogs" element={<BlogsManagement />} />
          <Route path="/admin/blogs/create" element={<CreateBlog />} />
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
