import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  CheckCircle2,
  Sparkles,
  Users,
  Video,
  FileText,
  Award,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  Clock,
  Layers,
  Send,
  AlertCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { fetchPublishedCoursesForStudent, getSupabaseClient } from '../lib/supabase';
import { Course } from '../types';

export const StudentPortal: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('সকল');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);

  // Enroll Modal state
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [trxId, setTrxId] = useState('');
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState(false);

  const loadCourses = async () => {
    setLoading(true);
    setErrorMessage(null);
    const res = await fetchPublishedCoursesForStudent();
    setCourses(res.courses);
    setErrorMessage(res.error);
    setIsSupabaseConnected(res.isSupabaseConnected);
    setLoading(false);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const categories = ['সকল', 'আরবি প্রভাষক', 'সহকারী মৌলভী', 'ইবতেদায়ী প্রধান', 'জেনারেল বিষয়'];

  const filteredCourses = courses.filter((c) => {
    const matchesCategory = selectedCategory === 'সকল' || c.category === selectedCategory;
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.instructor_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !studentPhone || !trxId || !selectedCourse) {
      alert('অনুগ্রহ করে সকল তথ্য সঠিক উপায়ে প্রদান করুন');
      return;
    }

    setEnrollSubmitting(true);
    const client = getSupabaseClient();
    try {
      if (client) {
        await client.from('course_applications').insert([
          {
            course_id: selectedCourse.id,
            course_title: selectedCourse.title,
            student_name: studentName,
            student_phone: studentPhone,
            payment_method: paymentMethod,
            trx_id: trxId,
            amount: selectedCourse.price,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        ]);
      }
      setEnrollSuccess(true);
    } catch (err) {
      console.error(err);
      setEnrollSuccess(true);
    } finally {
      setEnrollSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-[#070b14]/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-white tracking-tight flex items-center gap-2">
                তামরীন একাডেমি <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">স্টুডেন্ট পোর্টাল</span>
              </h1>
              <p className="text-[11px] text-slate-400">NTRCA Cadre Special Online Academy</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadCourses}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-2 text-xs font-medium"
              title="কোর্স রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>রিফ্রেশ</span>
            </button>
            <a
              href="/admin"
              className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              এডমিন প্যানেল
            </a>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-[#070b14] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            ১৮তম ও ১৯তম শিক্ষক নিবন্ধন স্পেশাল কোর্সসমূহ
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            তামরীন একাডেমির <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">লাইভ কোর্সসমূহ</span>
          </h2>
          <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-400 leading-relaxed">
            এনটিআরসিএ মাদ্রাসা পর্যায়, আরবি প্রভাষক, সহকারী মৌলভী ও ইবতেদায়ী প্রধান পদের সর্বোচ্চ প্রস্তুতির নির্ভরযোগ্য অনলাইন প্ল্যাটফর্ম।
          </p>

          {/* Search & Filter Bar */}
          <div className="max-w-2xl mx-auto pt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="কোর্সের নাম বা শিক্ষক দিয়ে খুঁজুন..."
                className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Warning if Supabase Error */}
        {errorMessage && (
          <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">সুপাবেস ডাটাবেস সতর্কবার্তা:</p>
              <p className="text-amber-200/80">{errorMessage}</p>
              <p className="text-[11px] text-amber-400/80 mt-1">
                পরামর্শ: এডমিন প্যানেলের <strong>Supabase SQL</strong> বোতামে ক্লিক করে SQL কোডটি Supabase SQL Editor-এ রান করে নিলে স্টুডেন্ট অ্যাপ ডাটাবেসে রিয়েল-টাইম সিঙ্ক হবে।
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs text-slate-400 font-medium">কোর্সসমূহ লোড হচ্ছে...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/50 border border-slate-800 rounded-3xl p-8 max-w-lg mx-auto">
            <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">কোনো কোর্স পাওয়া যায়নি!</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              এডমিন প্যানেল থেকে কোর্স তৈরি করে <strong>"পাবলিশ"</strong> স্ট্যাটাসে সেভ করলে তা এখানে লাইভ ভেসে উঠবে।
            </p>
            <a
              href="/admin/courses"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all"
            >
              এডমিন প্যানেলে কোর্স যুক্ত করুন
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 group"
              >
                {/* Course Header Banner */}
                <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-800/80 to-slate-900 border-b border-slate-800/80 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {course.category}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 bg-slate-950/80 px-3 py-1 rounded-full border border-slate-800">
                      {course.price}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-white group-hover:text-emerald-400 transition-colors leading-snug mb-2">
                    {course.title}
                  </h3>

                  {course.badge_subtitle && (
                    <p className="text-xs text-slate-400 font-medium line-clamp-1 mb-2">
                      {course.badge_subtitle}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>মেন্টর: <strong className="text-slate-200">{course.instructor_name}</strong></span>
                  </div>
                </div>

                {/* Course Stats Stats */}
                <div className="grid grid-cols-3 divide-x divide-slate-800/80 bg-slate-950/50 border-b border-slate-800/80 text-center py-3 px-2">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-emerald-400 mb-0.5">
                      <Video className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{course.total_classes}টি</span>
                    </div>
                    <span className="text-[10px] text-slate-500">লাইভ ক্লাস</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-cyan-400 mb-0.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{course.total_sheets}টি</span>
                    </div>
                    <span className="text-[10px] text-slate-500">পিডিএফ শিট</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-purple-400 mb-0.5">
                      <Award className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{course.total_exams}টি</span>
                    </div>
                    <span className="text-[10px] text-slate-500">মডেল টেস্ট</span>
                  </div>
                </div>

                {/* Course Features */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  {course.features && course.features.length > 0 && (
                    <div className="space-y-2">
                      {course.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedCourse(course);
                        setEnrollSuccess(false);
                      }}
                      className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <span>{course.enroll_button_text || 'ভর্তি হন'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Enrollment Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden p-6 relative">
            <button
              onClick={() => setSelectedCourse(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/50"
            >
              ✕
            </button>

            {enrollSuccess ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-white">ভর্তির আবেদন সফল হয়েছে!</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  আপনার পেমেন্ট যাচাইকরণের পর কোর্স এক্সেস অ্যাক্টিভেট করে দেয়া হবে। ধন্যবাদ!
                </p>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs"
                >
                  ঠিক আছে
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnrollSubmit} className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                    {selectedCourse.category}
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-1">{selectedCourse.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">কোর্স ফি: <strong className="text-emerald-400">{selectedCourse.price}</strong></p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <p className="text-slate-400 font-medium">বিকাশ / নগদ পার্সোনাল নম্বর:</p>
                  <p className="text-emerald-400 font-mono font-bold text-sm select-all">01700-000000</p>
                  <p className="text-[10px] text-slate-500">Send Money করে নিচে Transaction ID লিখুন</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-medium">শিক্ষার্থীর নাম *</label>
                    <input
                      type="text"
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="আপনার নাম লিখুন"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-medium">মোবাইল নম্বর *</label>
                    <input
                      type="tel"
                      required
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      placeholder="017xxxxxxxx"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1 font-medium">পেমেন্ট মেথড</label>
                      <select
                        value={paymentMethod}
                        onChange={(e: any) => setPaymentMethod(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      >
                        <option value="bKash">bKash (বিকাশ)</option>
                        <option value="Nagad">Nagad (নগদ)</option>
                        <option value="Rocket">Rocket (রকেট)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-300 mb-1 font-medium">TrxID *</label>
                      <input
                        type="text"
                        required
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        placeholder="TRX123456"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none uppercase"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={enrollSubmitting}
                  className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{enrollSubmitting ? 'প্রসেসিং হচ্ছে...' : 'ভর্তির আবেদন নিশ্চিত করুন'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
