import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, XCircle, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { getEnvSupabaseUrl, getEnvSupabaseAnonKey, updateSupabaseCredentials, testSupabaseConnection, clearCustomCredentials } from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(getEnvSupabaseUrl());
      setKey(getEnvSupabaseAnonKey());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!url || !key) {
      setTestResult({
        success: false,
        message: 'অনুগোত্র করে Supabase URL এবং Anon Key দিন।',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    // Update credentials temporarily in instance
    updateSupabaseCredentials(url, key);
    const res = await testSupabaseConnection();
    setTesting(false);
    setTestResult(res);
  };

  const handleSave = async () => {
    if (!url || !key) {
      setTestResult({
        success: false,
        message: 'সুপাবেস ইউআরএল এবং অ্যানন কী আবশ্যক।',
      });
      return;
    }

    updateSupabaseCredentials(url, key);
    const res = await testSupabaseConnection();
    setTestResult(res);

    if (res.success) {
      if (onConfigSaved) onConfigSaved();
      setTimeout(() => {
        onClose();
      }, 800);
    }
  };

  const handleResetToEnv = () => {
    clearCustomCredentials();
    setUrl(getEnvSupabaseUrl());
    setKey(getEnvSupabaseAnonKey());
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-6 relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Supabase কনফিগারেশন
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                public.questions টেবিলের সাথে ডাটাবেস সংযোগ পরিচালনা করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Supabase Project URL (NEXT_PUBLIC_SUPABASE_URL)
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Supabase Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
            </label>
            <textarea
              rows={3}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhY2Nlc3NfdG9rZW4i..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono resize-none"
            />
          </div>

          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                  : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{testResult.message}</p>
                {!testResult.success && (
                  <p className="mt-1 opacity-90 text-[11px]">
                    টিপস: নিশ্চিত করুন যে Supabase এর <strong>public.questions</strong> টেবিলটি তৈরি করা আছে এবং RLS পলিসি (Read/Write) সক্রিয় আছে।
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              অ্যাডমিন প্যানেলে সংরক্ষিত সব প্রশ্ন সরাসরি Supabase <code>public.questions</code> টেবিলে সংরক্ষিত হবে যা স্টুডেন্ট অ্যাপে স্বয়ংক্রিয়ভাবে দৃশ্যমান হবে।
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetToEnv}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline underline-offset-2"
          >
            ডিফল্ট এনভায়রনমেন্টে রিসেট করুন
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'পরীক্ষা করা হচ্ছে...' : 'কানেকশন টেস্ট'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
            >
              সেভ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
