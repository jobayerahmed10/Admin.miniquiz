import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { QuestionsList } from './pages/QuestionsList';
import { CreateQuestion } from './pages/CreateQuestion';
import { EditQuestion } from './pages/EditQuestion';
import { getSupabaseClient } from './lib/supabase';

// Protected Layout component wrapping admin routes
const AdminLayout: React.FC<{
  isAuthenticated: boolean;
  onLogout: () => void;
  userEmail?: string;
}> = ({ isAuthenticated, onLogout, userEmail }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <Navbar onLogout={onLogout} userEmail={userEmail} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 text-center text-xs text-slate-500">
        MiniQuiz Admin Panel &copy; {new Date().getFullYear()} &bull; Supabase Backend Connected
      </footer>
    </div>
  );
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-mono">MiniQuiz Admin লোড হচ্ছে...</p>
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
          <Route path="/admin" element={<Dashboard />} />
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
