import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  Save,
  Send,
  Eye,
  Plus,
  UploadCloud,
  Link as LinkIcon,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Tag,
  ExternalLink,
  ArrowLeft,
  Trash2,
  Copy,
  Layers,
  Check,
} from 'lucide-react';
import { RichTextEditor } from '../components/blog/RichTextEditor';
import { AddBlogCategoryModal } from '../components/blog/AddBlogCategoryModal';
import { BlogPreviewModal } from '../components/blog/BlogPreviewModal';
import {
  fetchBlogCategories,
  insertBlog,
  updateBlog,
  uploadBlogThumbnail,
  generateBlogSlug,
  fetchAllBlogs,
} from '../lib/supabase';
import { Blog, BlogCategory } from '../types';

export const CreateBlog: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: editBlogId } = useParams<{ id?: string }>();

  // Main Post States
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [authorName, setAuthorName] = useState('আত-তামরীন টিম');
  const [readTime, setReadTime] = useState('৫ মিনিট');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [externalLink, setExternalLink] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['NTRCA', 'শিক্ষক নিবন্ধন']);

  // Thumbnail State
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailMode, setThumbnailMode] = useState<'upload' | 'url'>('upload');
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Categories State
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // UI / Status states
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [publishSuccessModal, setPublishSuccessModal] = useState<Blog | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load Categories & Edit Data (if in edit mode)
  useEffect(() => {
    loadCategories();
    if (editBlogId) {
      loadBlogForEdit(editBlogId);
    }
  }, [editBlogId]);

  const loadCategories = async () => {
    setLoadingCategories(true);
    const { categories: fetchedCats } = await fetchBlogCategories();
    setCategories(fetchedCats);
    if (fetchedCats.length > 0 && !category) {
      setCategory(fetchedCats[0].name);
    }
    setLoadingCategories(false);
  };

  const loadBlogForEdit = async (id: string) => {
    const { blogs } = await fetchAllBlogs();
    const existing = blogs.find((b) => b.id === id);
    if (existing) {
      setTitle(existing.title);
      setSlug(existing.slug);
      setIsCustomSlug(true);
      setExcerpt(existing.excerpt || '');
      setContent(existing.content || '');
      setCategory(existing.category);
      setThumbnailUrl(existing.thumbnail_url || '');
      setExternalLink(existing.external_link || '');
      setAuthorName(existing.author_name || 'আত-তামরীন টিম');
      setReadTime(existing.read_time || '৫ মিনিট');
      setStatus(existing.status);
      setTags(existing.tags || []);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Title change & slug auto generation
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!isCustomSlug) {
      setSlug(generateBlogSlug(val));
    }
  };

  // Auto calculate reading time based on content
  const handleContentChange = (newHtml: string) => {
    setContent(newHtml);
    const text = newHtml.replace(/<[^>]*>?/gm, '').trim();
    const words = text ? text.split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.ceil(words / 150));
    setReadTime(`${minutes} মিনিট`);
  };

  // Handle Thumbnail Upload via file input or drag
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingThumb(true);
    const { url, error } = await uploadBlogThumbnail(file);
    setIsUploadingThumb(false);

    if (url) {
      setThumbnailUrl(url);
      showToast('থাম্বনেইল ইমেজ সফলভাবে আপলোড হয়েছে!', 'success');
    } else {
      showToast(`আপলোডে সমস্যা: ${error}`, 'error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Tags management
  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Save / Publish Blog
  const handleSavePost = async (publishStatus: 'published' | 'draft') => {
    if (!title.trim()) {
      showToast('দয়া করে ব্লগের শিরোনাম (Title) লিখুন', 'error');
      return;
    }

    if (!content.trim() || content === '<p><br></p>') {
      showToast('ব্লগের মূল লেখা (Content) খালি রাখা যাবে না', 'error');
      return;
    }

    setSaving(true);

    const postSlug = slug.trim() || generateBlogSlug(title);
    const selectedCat = categories.find((c) => c.name === category);

    const blogPayload = {
      title: title.trim(),
      slug: postSlug,
      excerpt: excerpt.trim(),
      content,
      category: category || 'NTRCA সার্কুলার ও নোটিশ',
      category_id: selectedCat?.id,
      thumbnail_url: thumbnailUrl.trim(),
      external_link: externalLink.trim(),
      author_name: authorName.trim() || 'আত-তামরীন টিম',
      read_time: readTime.trim() || '৫ মিনিট',
      status: publishStatus,
      tags,
    };

    try {
      if (editBlogId) {
        const { success, error } = await updateBlog(editBlogId, blogPayload);
        if (!success) throw new Error(error || 'ব্লগ আপডেট করতে সমস্যা হয়েছে');
        showToast('ব্লগ পোস্ট সফলভাবে আপডেট হয়েছে!', 'success');
        setPublishSuccessModal({
          ...blogPayload,
          id: editBlogId,
          created_at: new Date().toISOString(),
        });
      } else {
        const { blog, error } = await insertBlog(blogPayload);
        if (error) throw new Error(error);
        showToast(
          publishStatus === 'published' ? 'ব্লগটি সফলভাবে প্রকাশিত হয়েছে!' : 'ব্লগটি ড্রাফট হিসেবে সেভ হয়েছে!',
          'success'
        );
        if (blog) {
          setPublishSuccessModal(blog);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'ব্লগ সেভ করতে সমস্যা হয়েছে', 'error');
    } finally {
      setSaving(false);
    }
  };

  // New Category Created Callback
  const handleCategoryCreated = (newCat: BlogCategory) => {
    setCategories((prev) => [newCat, ...prev.filter((c) => c.id !== newCat.id)]);
    setCategory(newCat.name);
    showToast(`নতুন ক্যাটাগরি "${newCat.name}" যুক্ত হয়েছে!`, 'success');
  };

  const copyPostLink = (postSlug: string) => {
    const fullUrl = `${window.location.origin}/blog/${postSlug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const resetFormForNew = () => {
    setTitle('');
    setSlug('');
    setIsCustomSlug(false);
    setExcerpt('');
    setContent('');
    setThumbnailUrl('');
    setExternalLink('');
    setPublishSuccessModal(null);
    if (categories.length > 0) setCategory(categories[0].name);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold border transition-all animate-bounce ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-400'
              : 'bg-rose-600 text-white border-rose-400'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header & Actions Bar */}
      <div className="bg-white dark:bg-[#0a111e] border border-slate-200 dark:border-slate-800/90 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {editBlogId ? 'ব্লগ পোস্ট সম্পাদনা করুন' : 'নতুন ব্লগ তৈরি (Create Blog)'}
              </h1>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/30">
                WordPress & Blogspot Style
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              রিচ টেক্সট এডিটর, ক্যাটাগরি, থাম্বনেইল ও আবেদন লিংক সমন্বিত পূর্ণাঙ্গ ব্লগিং সিএমএস
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl flex items-center gap-1.5 transition-all border border-slate-300 dark:border-slate-700"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>প্রিভিউ দেখুন</span>
          </button>

          <button
            type="button"
            onClick={() => handleSavePost('draft')}
            disabled={saving}
            className="px-4 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-amber-500" />
            <span>ড্রাফট সংরক্ষণ</span>
          </button>

          <button
            type="button"
            onClick={() => handleSavePost('published')}
            disabled={saving}
            className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{editBlogId ? 'আপডেট ও প্রকাশ করুন' : 'পোস্ট প্রকাশ করুন (Publish)'}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column WordPress Style Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8-Cols: Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Post Title & SEO Slug Card */}
          <div className="bg-white dark:bg-[#0a111e] border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider mb-2">
                ব্লগের প্রধান শিরোনাম (Post Title) *
              </label>
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="যেমন: ১৮তম NTRCA শিক্ষক নিবন্ধন সার্কুলার ও আবেদন পদ্ধতি ২০২৬"
                className="w-full px-4 py-3 text-base sm:text-lg font-bold bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            {/* SEO Slug input */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-bold text-slate-500 shrink-0 font-mono">পারমালিংক (Slug):</span>
                <span className="text-slate-400 font-mono hidden sm:inline">/blog/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setIsCustomSlug(true);
                    setSlug(e.target.value);
                  }}
                  placeholder="post-slug-url"
                  className="flex-1 px-2.5 py-1 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCustomSlug(false);
                  setSlug(generateBlogSlug(title));
                }}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold shrink-0"
              >
                <Sparkles className="w-3 h-3" /> রিলোড স্লাগ
              </button>
            </div>

            {/* Excerpt / 2-Line Summary */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                সারসংক্ষেপ / শর্ট ডেসক্রিপশন (Short Excerpt - ২/৩ লাইনে সংক্ষেপ)
              </label>
              <textarea
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="পোস্টের মূল বিষয়বস্তুর আকর্ষণীয় সংক্ষিপ্ত বিবরণ যা পোস্ট কার্ড এবং গুগলের সার্চ রেজাল্টে দেখা যাবে..."
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all leading-relaxed"
              />
            </div>
          </div>

          {/* Full WYSIWYG Content Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="block text-xs font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider">
                ব্লগের মূল বডি ও কনটেন্ট (WYSIWYG Rich Text Editor) *
              </label>
              <span className="text-xs text-slate-400">
                হেডিংস, টেবিল, লিস্ট, কালার ও ইমেজ টুলবার ব্যবহার করুন
              </span>
            </div>
            <RichTextEditor
              content={content}
              onChange={handleContentChange}
              placeholder="এখানে আপনার ব্লগের সম্পূর্ণ লেখা, নোটিশের বিস্তারিত, টেবিল, বুলেট পয়েন্ট এবং ছবি যুক্ত করুন..."
            />
          </div>

          {/* External Links & Action Widget */}
          <div className="bg-white dark:bg-[#0a111e] border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-emerald-500" />
              অফিসিয়াল সার্কুলার / মূল আবেদন ও এক্সটার্নাল লিংক (External Application Link)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              শিক্ষার্থীরা ব্লগে এই লিংকের মাধ্যমে সরাসরি সরকারি ওয়েবসাইট বা সার্কুলার পোর্টালে আবেদন করতে পারবে।
            </p>
            <div className="relative">
              <input
                type="url"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="যেমন: http://ntrca.teletalk.com.bd বা https://www.dpe.gov.bd"
                className="w-full pl-10 pr-4 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>
        </div>

        {/* Right 4-Cols: Post Settings & Metadata Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. Status & Visibility Card */}
          <div className="bg-white dark:bg-[#0a111e] border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <span>পাবলিশ ও স্ট্যাটাস সেটিংস</span>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                  status === 'published'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {status === 'published' ? 'পাবলিশড' : 'ড্রাফট'}
              </span>
            </h3>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                পোস্টের অবস্থা নির্বাচন করুন
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('published')}
                  className={`p-2.5 text-xs font-bold rounded-2xl border transition-all flex items-center justify-center gap-2 ${
                    status === 'published'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>পাবলিশড (Live)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  className={`p-2.5 text-xs font-bold rounded-2xl border transition-all flex items-center justify-center gap-2 ${
                    status === 'draft'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>ড্রাফট (Draft)</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> লেখক / Author:
                </span>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-36 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-semibold text-right"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> পড়ার সময়:
                </span>
                <input
                  type="text"
                  value={readTime}
                  onChange={(e) => setReadTime(e.target.value)}
                  className="w-24 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-semibold text-right"
                />
              </div>
            </div>
          </div>

          {/* 2. Dynamic Category Selector */}
          <div className="bg-white dark:bg-[#0a111e] border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                ব্লগ ক্যাটাগরি (Category) *
              </h3>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(true)}
                className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/30 flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন ক্যাটাগরি</span>
              </button>
            </div>

            <div className="space-y-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loadingCategories}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <p className="text-[11px] text-slate-400">
                ডাটাবেজের <code className="text-emerald-500 font-mono">blog_categories</code> টেবিল থেকে লাইভ লোড হচ্ছে।
              </p>
            </div>
          </div>

          {/* 3. Featured Image / Thumbnail Management */}
          <div className="bg-white dark:bg-[#0a111e] border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-500" />
                ফিচার্ড থাম্বনেইল (Thumbnail)
              </span>
              <span className="text-[11px] text-slate-400">Supabase Storage</span>
            </h3>

            {/* Switch between Upload or URL paste */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setThumbnailMode('upload')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  thumbnailMode === 'upload'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                ফাইল আপলোড
              </button>
              <button
                type="button"
                onClick={() => setThumbnailMode('url')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  thumbnailMode === 'url'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                ইমেজ লিংক পেস্ট
              </button>
            </div>

            {thumbnailMode === 'upload' ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40'
                }`}
              >
                <input
                  type="file"
                  id="thumbFileInput"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
                <label
                  htmlFor="thumbFileInput"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      ইমেজ ড্র্যাগ করে ছাড়ুন অথবা ব্রাউজ করুন
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      PNG, JPG, WebP সর্বোচ্চ 5MB (সুপাবেজ <code className="text-emerald-500 font-mono">blog-thumbnails</code> বাকেট)
                    </p>
                  </div>
                </label>
                {isUploadingThumb && (
                  <p className="text-xs text-emerald-400 mt-2 font-medium animate-pulse">
                    আপলোড সম্পন্ন হচ্ছে...
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://example.com/cover-image.jpg"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <p className="text-[10px] text-slate-400">যেকোনো ওয়েব ইমেজ ইউআরএল পেস্ট করতে পারেন</p>
              </div>
            )}

            {/* Thumbnail Live Preview */}
            {thumbnailUrl && (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm group">
                <img
                  src={thumbnailUrl}
                  alt="Post Thumbnail"
                  className="w-full h-36 object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setThumbnailUrl('')}
                    className="p-2 bg-rose-600 text-white rounded-xl hover:bg-rose-500 transition-colors shadow"
                    title="থাম্বনেইল মুছুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Tags & SEO Keywords */}
          <div className="bg-white dark:bg-[#0a111e] border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Tag className="w-4 h-4 text-purple-500" />
              ট্যাগ ও কিওয়ার্ডস (Tags)
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="যেমন: আরবি_প্রভাষক"
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
              >
                যুক্ত
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-xl flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-slate-400 hover:text-rose-500 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      <AddBlogCategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onCategoryCreated={handleCategoryCreated}
      />

      {/* Live Preview Modal */}
      <BlogPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        blog={{
          title,
          slug,
          excerpt,
          content,
          category,
          thumbnail_url: thumbnailUrl,
          external_link: externalLink,
          author_name: authorName,
          read_time: readTime,
          status,
          tags,
          created_at: new Date().toISOString(),
        }}
      />

      {/* Post-Publish Success Modal */}
      {publishSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-5 animate-scale-up text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                ব্লগ সফলভাবে {publishSuccessModal.status === 'published' ? 'প্রকাশিত' : 'সংরক্ষিত'} হয়েছে!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                আপনার পোস্টটি সুপাবেজ ডাটাবেজে যুক্ত হয়েছে এবং লাইভ দেখা যাচ্ছে।
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-2">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                {publishSuccessModal.title}
              </p>
              <div className="flex items-center justify-between gap-2 text-xs font-mono bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400">
                <span className="truncate">/blog/{publishSuccessModal.slug}</span>
                <button
                  onClick={() => copyPostLink(publishSuccessModal.slug)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-200 transition-colors shrink-0"
                  title="লিংক কপি করুন"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPublishSuccessModal(null);
                  setPreviewOpen(true);
                }}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700"
              >
                <Eye className="w-4 h-4 text-emerald-500" />
                <span>লাইভ প্রিভিউ দেখুন</span>
              </button>

              <button
                type="button"
                onClick={resetFormForNew}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>আরেকটি ব্লগ তৈরি করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
