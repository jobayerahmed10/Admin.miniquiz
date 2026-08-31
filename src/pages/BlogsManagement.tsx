import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle2,
  Clock3,
  Layers,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { fetchAllBlogs, deleteBlog, fetchBlogCategories } from '../lib/supabase';
import { Blog, BlogCategory } from '../types';
import { BlogPreviewModal } from '../components/blog/BlogPreviewModal';

export const BlogsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [previewBlog, setPreviewBlog] = useState<Blog | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [blogsRes, catsRes] = await Promise.all([
      fetchAllBlogs(),
      fetchBlogCategories(),
    ]);
    setBlogs(blogsRes.blogs);
    setCategories(catsRes.categories);
    setLoading(false);
  };

  const handleDeleteBlog = async (id: string, title: string) => {
    if (window.confirm(`আপনি কি নিশ্চিত যে "${title}" ব্লগ পোস্টটি মুছে ফেলতে চান?`)) {
      const { success } = await deleteBlog(id);
      if (success) {
        setBlogs(blogs.filter((b) => b.id !== id));
      }
    }
  };

  const filteredBlogs = blogs.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.excerpt && b.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || b.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || b.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const publishedCount = blogs.filter((b) => b.status === 'published').length;
  const draftCount = blogs.filter((b) => b.status === 'draft').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0a111e] border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ব্লগ ও নোটিশ ব্যবস্থাপনা (Blog CMS)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              মোট পোস্ট: <strong className="text-emerald-500">{blogs.length}</strong> &bull; প্রকাশিত:{' '}
              <strong className="text-emerald-500">{publishedCount}</strong> &bull; ড্রাফট:{' '}
              <strong className="text-amber-500">{draftCount}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors border border-slate-300 dark:border-slate-700"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/admin/create-blog"
            className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all flex-1 sm:flex-initial"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ব্লগ তৈরি করুন</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#0a111e] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="শিরোনাম বা কীওয়ার্ড দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">সকল ক্যাটাগরি ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">সকল অবস্থা</option>
            <option value="published">শুধুমাত্র প্রকাশিত ({publishedCount})</option>
            <option value="draft">শুধুমাত্র ড্রাফট ({draftCount})</option>
          </select>
        </div>
      </div>

      {/* Blogs List Grid / Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">ব্লগ লোড হচ্ছে...</p>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="bg-white dark:bg-[#0a111e] border border-slate-200 dark:border-slate-800/90 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">কোনো ব্লগ পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm
                ? 'আপনার সার্চ ফিল্টারের সাথে মিলে এমন কোনো ব্লগ পাওয়া যায়নি।'
                : 'এখনো কোনো ব্লগ তৈরি করা হয়নি। এখনই ওয়ার্ডপ্রেস স্টাইলে প্রথম ব্লগ তৈরি করুন!'}
            </p>
          </div>
          <Link
            to="/admin/create-blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ব্লগ তৈরি করুন</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBlogs.map((blog) => (
            <div
              key={blog.id}
              className="bg-white dark:bg-[#0a111e] border border-slate-200 dark:border-slate-800/90 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
            >
              {/* Thumbnail Container */}
              <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                {blog.thumbnail_url ? (
                  <img
                    src={blog.thumbnail_url}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
                    <FileText className="w-10 h-10 text-emerald-500/40" />
                    <span className="text-[10px] mt-1 font-semibold">কোনো থাম্বনেইল নেই</span>
                  </div>
                )}

                <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1 max-w-[80%]">
                  <span className="px-2 py-0.5 bg-slate-950/85 backdrop-blur-md text-emerald-400 text-[10px] font-bold rounded-lg border border-slate-700 shadow-sm flex items-center gap-1">
                    <span>📁 {blog.category}</span>
                    {blog.sub_category && (
                      <>
                        <span className="text-slate-500">›</span>
                        <span className="text-slate-200">📂 {blog.sub_category}</span>
                      </>
                    )}
                    {blog.topic && (
                      <>
                        <span className="text-slate-500">›</span>
                        <span className="text-emerald-300">📖 {blog.topic}</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase backdrop-blur-md ${
                      blog.status === 'published'
                        ? 'bg-emerald-500/90 text-slate-950 shadow-sm'
                        : 'bg-amber-500/90 text-slate-950 shadow-sm'
                    }`}
                  >
                    {blog.status === 'published' ? 'লাইভ' : 'ড্রাফট'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-emerald-500 transition-colors">
                    {blog.title}
                  </h3>
                  {blog.excerpt && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {blog.excerpt}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {blog.read_time || '৫ মিনিট'}
                  </span>
                  <span className="font-mono text-[10px]">/{blog.slug}</span>
                </div>

                {/* Card Action Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => setPreviewBlog(blog)}
                    className="py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center gap-1 transition-colors border border-slate-200 dark:border-slate-700"
                    title="প্রিভিউ দেখুন"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-500" />
                    <span>প্রিভিউ</span>
                  </button>

                  <button
                    onClick={() => navigate(`/admin/create-blog/edit/${blog.id}`)}
                    className="py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl flex items-center justify-center gap-1 transition-colors border border-blue-200 dark:border-blue-800/40"
                    title="সম্পাদনা করুন"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>এডিট</span>
                  </button>

                  <button
                    onClick={() => handleDeleteBlog(blog.id, blog.title)}
                    className="py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl flex items-center justify-center gap-1 transition-colors border border-rose-200 dark:border-rose-800/40"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ডিলিট</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewBlog && (
        <BlogPreviewModal
          isOpen={Boolean(previewBlog)}
          onClose={() => setPreviewBlog(null)}
          blog={previewBlog}
        />
      )}
    </div>
  );
};
