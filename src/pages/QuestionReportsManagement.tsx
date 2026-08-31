import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchQuestionReports, updateQuestionReportStatus } from '../lib/supabase';
import { QuestionReport } from '../types';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Edit, 
  Search, 
  Check
} from 'lucide-react';

export const QuestionReportsManagement: React.FC = () => {
  const [reports, setReports] = useState<QuestionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const navigate = useNavigate();

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadReports = async () => {
    setLoading(true);
    const { reports: data, error } = await fetchQuestionReports();
    if (error) {
      showToast('রিপোর্ট লোড করতে সমস্যা হয়েছে', 'error');
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleResolve = async (id: string) => {
    const { success, error } = await updateQuestionReportStatus(id, 'resolved');
    if (success) {
      showToast('রিপোর্টটি সমাধান করা হয়েছে', 'success');
      setReports((prev) => 
        prev.map((r) => r.id === id ? { ...r, status: 'resolved', resolved_at: new Date().toISOString() } : r)
      );
    } else {
      showToast('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে: ' + error, 'error');
    }
  };

  const filteredReports = reports.filter(r => {
    const rStatus = r.status || 'pending';
    const matchesFilter = filter === 'all' ? true : rStatus === filter;
    const searchLower = searchTerm.toLowerCase();
    const reporter = (r.reporter_name || r.user_id || '').toLowerCase();
    const desc = (r.issue_description || r.reason || r.issue || '').toLowerCase();
    const matchesSearch = 
      desc.includes(searchLower) ||
      reporter.includes(searchLower) ||
      (r.question?.question && r.question.question.toLowerCase().includes(searchLower));
      
    return matchesFilter && matchesSearch;
  });

  const pendingCount = reports.filter(r => (r.status || 'pending') === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-rose-500" />
            প্রশ্ন রিপোর্ট ম্যানেজমেন্ট
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            শিক্ষার্থীদের দ্বারা রিপোর্টকৃত প্রশ্নসমূহ সমাধান করুন
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-full border border-rose-100 dark:border-rose-500/20">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-semibold">{pendingCount} পেন্ডিং রিপোর্ট</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="রিপোর্ট খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === 'all' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Reports
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                filter === 'pending' 
                  ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                filter === 'resolved' 
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Resolved
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">কোনো রিপোর্ট পাওয়া যায়নি</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {searchTerm || filter !== 'all' ? 'আপনার ফিল্টারের সাথে মিলে এমন কোনো রিপোর্ট নেই।' : 'সব কিছু ঠিকঠাক আছে।'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Question</th>
                  <th className="px-4 py-3">Report Details</th>
                  <th className="px-4 py-3">Reporter</th>
                  <th className="px-4 py-3 whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-4 py-3 max-w-[250px]">
                      {report.question ? (
                        <>
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate" title={report.question.question}>
                            {report.question.question}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-mono">ID: {report.question_id}</p>
                        </>
                      ) : (
                        <span className="text-sm text-slate-400 italic">প্রশ্নটি মুছে ফেলা হয়েছে (ID: {report.question_id})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[300px]">
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2" title={report.issue_description || report.reason || report.issue}>
                        {report.issue_description || report.reason || report.issue || 'No details provided'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {report.reporter_name || report.user_id || 'Anonymous User'}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs text-slate-500">
                        {report.created_at ? new Date(report.created_at).toLocaleDateString('bn-BD', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 'N/A'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        (report.status || 'pending') === 'resolved' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' 
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                      }`}>
                        {(report.status || 'pending') === 'resolved' ? 'Resolved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {report.question && (
                          <button
                            onClick={() => navigate(`/admin/questions/edit/${report.question_id}`)}
                            className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                            title="Edit Question"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {(report.status || 'pending') === 'pending' && (
                          <button
                            onClick={() => handleResolve(report.id)}
                            className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Mark as Resolved"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300' 
              : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-300'
          }`}>
            <span className="text-sm font-semibold">{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};
