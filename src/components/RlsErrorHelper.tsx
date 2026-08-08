import React, { useState } from 'react';
import { ShieldAlert, Copy, Check, Terminal, ExternalLink } from 'lucide-react';

interface RlsErrorHelperProps {
  errorMsg: string;
}

export const RlsErrorHelper: React.FC<RlsErrorHelperProps> = ({ errorMsg }) => {
  const [copied, setCopied] = useState(false);

  // Check if error is related to Supabase Row-Level Security (RLS)
  const isRlsError =
    errorMsg.includes('row-level security') ||
    errorMsg.includes('42501') ||
    errorMsg.includes('violates row-level security policy');

  if (!isRlsError) return null;

  const sqlQuery = `-- Supabase SQL Editor এ এই কমান্ডটি রানিং করলে RLS সমস্যা ঠিক হয়ে যাবে:
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-2xl text-amber-900 dark:text-amber-200 text-xs space-y-3">
      <div className="flex items-start gap-2.5">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-sm text-amber-950 dark:text-amber-100">
            কীভাবে এই সমস্যা সমাধান করবেন? (Supabase RLS Fix)
          </h4>
          <p className="mt-1 leading-relaxed opacity-95">
            আপনার Supabase এর <strong>questions</strong> টেবিলে Row Level Security (RLS) সক্রিয় থাকায় টেবিলটি নতুন কোনো রেকর্ড সেভ/রাইট করতে দিচ্ছে না। নিচের ৩টি ধাপ অনুসরণ করুন:
          </p>
        </div>
      </div>

      <ol className="list-decimal list-inside space-y-1.5 pl-1 font-medium text-[11px] leading-relaxed text-amber-900 dark:text-amber-200">
        <li>
          আপনার{' '}
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-bold text-amber-800 dark:text-amber-300 hover:text-amber-600 inline-flex items-center gap-1"
          >
            Supabase Dashboard <ExternalLink className="w-3 h-3" />
          </a>{' '}
          এ যান।
        </li>
        <li>
          বামপাশের মেনু থেকে <strong className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">SQL Editor</strong> এ যান।
        </li>
        <li>
          নিচের SQL কমান্ডটি পেস্ট করে <strong className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">Run</strong> বাটনে ক্লিক করুন:
        </li>
      </ol>

      <div className="relative group">
        <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800 flex items-center justify-between">
          <code>{sqlQuery}</code>
          <button
            type="button"
            onClick={handleCopy}
            className="ml-2 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[10px] flex items-center gap-1 shrink-0 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" /> কপি হয়েছে
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> কপি করুণ
              </>
            )}
          </button>
        </div>
      </div>

      <p className="text-[10px] text-amber-700 dark:text-amber-400 italic">
        * টিপস: আপনি যদি RLS পলিসি অন রাখতে চান, তবে <code className="font-mono font-bold">CREATE POLICY "Allow public insert" ON questions FOR INSERT WITH CHECK (true);</code> চালাতে পারেন।
      </p>
    </div>
  );
};
