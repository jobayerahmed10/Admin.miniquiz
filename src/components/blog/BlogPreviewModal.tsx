import React from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  ExternalLink,
  Tag,
  Share2,
  Bookmark,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { Blog } from '../../types';

interface BlogPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  blog: Partial<Blog>;
}

export const BlogPreviewModal: React.FC<BlogPreviewModalProps> = ({
  isOpen,
  onClose,
  blog,
}) => {
  if (!isOpen) return null;

  const formatDate = (dateStr?: string) => {
    try {
      const d = dateStr ? new Date(dateStr) : new Date();
      return d.toLocaleDateString('bn-BD', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'আজ';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#0a101d] border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-scale-up">
        {/* Preview Top Header */}
        <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-100/80 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              লাইভ পোস্ট প্রিভিউ (Student View)
            </span>
            {blog.status === 'draft' && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-[11px] font-bold rounded-md border border-amber-500/30">
                ড্রাফট (Draft)
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Blog Article Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          {/* Category & Metadata */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-full shadow-sm">
                {blog.category || 'সাধারণ'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {blog.read_time || '৫ মিনিট'} পড়ার সময়
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {formatDate(blog.created_at)}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
              {blog.title || 'শিরোনামহীন ব্লগ'}
            </h1>

            {/* Author Bar */}
            <div className="flex items-center justify-between pt-2 pb-4 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                  {blog.author_name?.[0] || 'আ'}
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{blog.author_name || 'আত-তামরীন টিম'}</p>
                  <p className="text-[10px] text-slate-400">NTRCA স্পেশাল একাডেমি</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200">
                  <Bookmark className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Featured Thumbnail */}
          {blog.thumbnail_url && (
            <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg max-h-[420px]">
              <img
                src={blog.thumbnail_url}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Excerpt / Short Description Callout */}
          {blog.excerpt && (
            <div className="p-4 sm:p-5 bg-slate-100 dark:bg-slate-800/60 border-l-4 border-emerald-500 rounded-r-2xl text-slate-700 dark:text-slate-300 font-medium text-sm sm:text-base leading-relaxed italic">
              {blog.excerpt}
            </div>
          )}

          {/* External Action Button if present */}
          {blog.external_link && (
            <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">অফিসিয়াল সার্কুলার / আবেদন লিংক</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-md">
                  {blog.external_link}
                </p>
              </div>
              <a
                href={blog.external_link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 shrink-0 transition-all"
              >
                <span>সরাসরি আবেদন করুন</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Main Content HTML Render */}
          <div
            className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{
              __html: blog.content || '<p className="text-slate-400 italic">কোনো কনটেন্ট নেই...</p>',
            }}
          />

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> ট্যাগ:
              </span>
              {blog.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500">
          <div className="font-mono">
            URL: <span className="text-emerald-600 dark:text-emerald-400">/blog/{blog.slug || 'slug-url'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-colors"
          >
            প্রিভিউ বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
