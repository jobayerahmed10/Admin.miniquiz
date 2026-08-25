import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Award,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  TrendingUp,
  UserCheck,
  CheckCircle,
  Copy,
  Check,
  Filter,
} from 'lucide-react';
import { StudentUser } from '../types';
import { fetchAllRegisteredStudentsForAdmin } from '../lib/studentAuth';

export const StudentsManagement: React.FC = () => {
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadStudents = async () => {
    setLoading(true);
    const list = await fetchAllRegisteredStudentsForAdmin();
    setStudents(list);
    setLoading(false);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredStudents = students.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.student_id_code.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              নিবন্ধিত শিক্ষার্থী তালিকা (Students)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              মোবাইল ও ইমেইল দিয়ে অ্যাকাউন্ট তৈরি করা সকল শিক্ষার্থীর আইডি ও বিবরণী
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadStudents}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 transition-all border border-slate-700 shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>রিফ্রেশ</span>
          </button>
        </div>
      </div>

      {/* Search & Counter Filter */}
      <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="নাম, আইডি বা মোবাইল নম্বর দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-400">
          <span>মোট শিক্ষার্থী:</span>
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 font-mono">
            {students.length} জন
          </span>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-4">শিক্ষার্থী আইডি</th>
                <th className="p-4">নাম</th>
                <th className="p-4">মোবাইল / ইমেইল</th>
                <th className="p-4">টার্গেট পরীক্ষা</th>
                <th className="p-4">অংশগ্রহণ</th>
                <th className="p-4">যোগদান</th>
                <th className="p-4 text-right">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Student ID */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          {s.student_id_code}
                        </span>
                        <button
                          onClick={() => handleCopy(s.student_id_code)}
                          title="আইডি কপি করুন"
                          className="text-slate-500 hover:text-slate-300 p-1"
                        >
                          {copiedId === s.student_id_code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Name */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                          {s.name.charAt(0)}
                        </div>
                        <span className="font-bold text-white">{s.name}</span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        {s.phone && (
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{s.phone}</span>
                          </div>
                        )}
                        {s.email && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>{s.email}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Target Exam */}
                    <td className="p-4 whitespace-nowrap text-slate-300">
                      {s.target_exam || 'NTRCA প্রভাষক'}
                    </td>

                    {/* Activity */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 font-bold">{s.total_exams_taken || 0} টি টেস্ট</span>
                        {s.avg_score ? (
                          <span className="text-[10px] text-emerald-400 font-bold">({s.avg_score}%)</span>
                        ) : null}
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="p-4 whitespace-nowrap text-slate-400">
                      {new Date(s.created_at).toLocaleDateString('bn-BD')}
                    </td>

                    {/* Status */}
                    <td className="p-4 whitespace-nowrap text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <UserCheck className="w-3 h-3" /> সক্রিয় শিক্ষার্থী
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                    কোনো শিক্ষার্থী পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
