import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  GraduationCap,
  Award,
  Briefcase,
  Sparkles,
  Languages,
  FileText,
  Clock,
  ArrowUpDown,
  MoveUp,
  MoveDown,
  X,
  RefreshCw,
  Eye,
  Check,
  FolderPlus,
  HelpCircle,
  ChevronRight,
  ListOrdered,
} from 'lucide-react';
import { SubjectPost, SyllabusTopic, Question } from '../types';
import {
  fetchSubjectPosts,
  createSubjectPost,
  updateSubjectPost,
  deleteSubjectPost,
  addTopicToPost,
  updateTopicInPost,
  deleteTopicFromPost,
  reorderTopicsInPost,
} from '../lib/subjectPostManager';
import { fetchAllQuestions } from '../lib/supabase';
import { ConfirmModal } from '../components/ConfirmModal';

// Icon Map
const ICON_OPTIONS = [
  { name: 'BookOpen', label: 'বই / পাঠ্য', icon: BookOpen },
  { name: 'Languages', label: 'ভাষা / আরবি', icon: Languages },
  { name: 'Award', label: 'পুরস্কার / ক্যাডার', icon: Award },
  { name: 'GraduationCap', label: 'শিক্ষা / প্রভাষক', icon: GraduationCap },
  { name: 'Briefcase', label: 'চাকরি / শিক্ষক', icon: Briefcase },
  { name: 'Sparkles', label: 'স্পেশাল / কারী', icon: Sparkles },
  { name: 'Layers', label: 'সিলেবাস / স্তর', icon: Layers },
  { name: 'FileText', label: 'নোটস / শিট', icon: FileText },
];

const COLOR_THEMES = [
  { key: 'emerald', label: 'পান্না সবুজ (Emerald)', gradient: 'from-emerald-600 to-teal-500', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-400' },
  { key: 'teal', label: 'টিয়াল সায়ান (Teal)', gradient: 'from-teal-600 to-cyan-500', bg: 'bg-teal-500/15', border: 'border-teal-500/40', text: 'text-teal-400' },
  { key: 'amber', label: 'অ্যাম্বার গোল্ড (Amber)', gradient: 'from-amber-600 to-yellow-500', bg: 'bg-amber-500/15', border: 'border-amber-500/40', text: 'text-amber-400' },
  { key: 'indigo', label: 'ইন্ডিগো পার্পল (Indigo)', gradient: 'from-indigo-600 to-purple-500', bg: 'bg-indigo-500/15', border: 'border-indigo-500/40', text: 'text-indigo-400' },
  { key: 'rose', label: 'গোলাপী লাল (Rose)', gradient: 'from-rose-600 to-pink-500', bg: 'bg-rose-500/15', border: 'border-rose-500/40', text: 'text-rose-400' },
  { key: 'purple', label: 'রয়েল পার্পল (Purple)', gradient: 'from-purple-600 to-indigo-500', bg: 'bg-purple-500/15', border: 'border-purple-500/40', text: 'text-purple-400' },
  { key: 'blue', label: 'স্কাই ব্লু (Blue)', gradient: 'from-blue-600 to-indigo-500', bg: 'bg-blue-500/15', border: 'border-blue-500/40', text: 'text-blue-400' },
];

export const SubjectPostsManagement: React.FC = () => {
  const [posts, setPosts] = useState<SubjectPost[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');

  // Modals
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SubjectPost | null>(null);

  const [activeTopicsPost, setActiveTopicsPost] = useState<SubjectPost | null>(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [editingTopic, setEditingTopic] = useState<SyllabusTopic | null>(null);

  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    isOpen: boolean;
    type: 'post' | 'topic';
    postId: string;
    topicId?: string;
    title: string;
  }>({
    isOpen: false,
    type: 'post',
    postId: '',
    title: '',
  });

  // Post Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTheme, setFormTheme] = useState('emerald');
  const [formIcon, setFormIcon] = useState('BookOpen');
  const [formStatus, setFormStatus] = useState<'active' | 'draft'>('active');
  const [formError, setFormError] = useState<string | null>(null);
  const [savingPost, setSavingPost] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [postsRes, questionsRes] = await Promise.all([
        fetchSubjectPosts(),
        fetchAllQuestions(),
      ]);
      setPosts(postsRes.posts);
      if (questionsRes.questions) {
        setQuestions(questionsRes.questions);
      }
    } catch (err) {
      console.error('Error loading subject posts data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();

    const handleUpdate = () => {
      fetchSubjectPosts().then((res) => setPosts(res.posts));
    };
    window.addEventListener('subject_posts_updated', handleUpdate);
    return () => window.removeEventListener('subject_posts_updated', handleUpdate);
  }, []);

  // Update activeTopicsPost if posts change
  useEffect(() => {
    if (activeTopicsPost) {
      const updated = posts.find((p) => p.id === activeTopicsPost.id);
      if (updated) {
        setActiveTopicsPost(updated);
      }
    }
  }, [posts]);

  // Open Post Create Modal
  const handleOpenCreatePost = () => {
    setEditingPost(null);
    setFormName('');
    setFormCode(`POST-${(posts.length + 1).toString().padStart(2, '0')}`);
    setFormTagline('');
    setFormDesc('');
    setFormTheme('emerald');
    setFormIcon('BookOpen');
    setFormStatus('active');
    setFormError(null);
    setIsPostModalOpen(true);
  };

  // Open Post Edit Modal
  const handleOpenEditPost = (post: SubjectPost) => {
    setEditingPost(post);
    setFormName(post.name);
    setFormCode(post.code);
    setFormTagline(post.tagline || '');
    setFormDesc(post.description || '');
    setFormTheme(post.theme_color || 'emerald');
    setFormIcon(post.icon_name || 'BookOpen');
    setFormStatus(post.status);
    setFormError(null);
    setIsPostModalOpen(true);
  };

  // Save Post (Create / Update)
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('পদের নাম অবশ্যই প্রদান করতে হবে।');
      return;
    }
    if (!formCode.trim()) {
      setFormError('পদ কোড অবশ্যই প্রদান করতে হবে।');
      return;
    }

    setSavingPost(true);
    setFormError(null);

    const selectedThemeObj = COLOR_THEMES.find((c) => c.key === formTheme) || COLOR_THEMES[0];

    try {
      if (editingPost) {
        const res = await updateSubjectPost(editingPost.id, {
          name: formName.trim(),
          code: formCode.trim().toUpperCase(),
          tagline: formTagline.trim(),
          description: formDesc.trim(),
          theme_color: formTheme,
          gradient: selectedThemeObj.gradient,
          icon_name: formIcon,
          status: formStatus,
        });

        if (res.success) {
          showToast('পদটির তথ্য সফলভাবে আপডেট করা হয়েছে!');
          setIsPostModalOpen(false);
          loadAllData();
        } else {
          setFormError(res.error || 'আপডেট করতে সমস্যা হয়েছে।');
        }
      } else {
        const res = await createSubjectPost({
          name: formName.trim(),
          code: formCode.trim().toUpperCase(),
          tagline: formTagline.trim(),
          description: formDesc.trim(),
          theme_color: formTheme,
          gradient: selectedThemeObj.gradient,
          icon_name: formIcon,
          status: formStatus,
          order_index: posts.length + 1,
          topics: [],
        });

        if (res.success) {
          showToast('নতুন পদ সফলভাবে যোগ করা হয়েছে!');
          setIsPostModalOpen(false);
          loadAllData();
        } else {
          setFormError(res.error || 'নতুন পদ যোগ করতে ব্যর্থ হয়েছে।');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'অপ্রত্যাশিত ত্রুটি ঘটেছে।');
    } finally {
      setSavingPost(false);
    }
  };

  // Toggle Post Status
  const handleTogglePostStatus = async (post: SubjectPost) => {
    const newStatus = post.status === 'active' ? 'draft' : 'active';
    const res = await updateSubjectPost(post.id, { status: newStatus });
    if (res.success) {
      showToast(`পদের স্ট্যাটাস "${newStatus === 'active' ? 'সক্রিয়' : 'ড্রাফট'}" করা হয়েছে।`);
      loadAllData();
    }
  };

  // Delete Post
  const handleConfirmDelete = async () => {
    if (confirmDeleteModal.type === 'post') {
      const res = await deleteSubjectPost(confirmDeleteModal.postId);
      if (res.success) {
        showToast('পদটি সফলভাবে মুছে ফেলা হয়েছে।');
        if (activeTopicsPost?.id === confirmDeleteModal.postId) {
          setActiveTopicsPost(null);
        }
        loadAllData();
      }
    } else if (confirmDeleteModal.type === 'topic' && confirmDeleteModal.topicId) {
      const res = await deleteTopicFromPost(confirmDeleteModal.postId, confirmDeleteModal.topicId);
      if (res.success) {
        showToast('টপিকটি সফলভাবে মুছে ফেলা হয়েছে।');
        loadAllData();
      }
    }
    setConfirmDeleteModal({ isOpen: false, type: 'post', postId: '', title: '' });
  };

  // Add Topic
  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTopicsPost || !newTopicName.trim()) return;

    const res = await addTopicToPost(activeTopicsPost.id, {
      name: newTopicName.trim(),
      description: newTopicDesc.trim(),
    });

    if (res.success) {
      setNewTopicName('');
      setNewTopicDesc('');
      showToast('নতুন সিলেবাস টপিক সফলভাবে যুক্ত হয়েছে!');
      loadAllData();
    } else {
      showToast(res.error || 'টপিক যুক্ত করতে ব্যর্থ হয়েছে।', 'error');
    }
  };

  // Update Topic
  const handleSaveTopicEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTopicsPost || !editingTopic || !editingTopic.name.trim()) return;

    const res = await updateTopicInPost(activeTopicsPost.id, editingTopic.id, {
      name: editingTopic.name.trim(),
      description: editingTopic.description?.trim() || '',
    });

    if (res.success) {
      setEditingTopic(null);
      showToast('টপিক সফলভাবে আপডেট করা হয়েছে!');
      loadAllData();
    } else {
      showToast(res.error || 'টপিক আপডেট ব্যর্থ হয়েছে।', 'error');
    }
  };

  // Reorder Topics (Move Up / Down)
  const handleMoveTopic = async (index: number, direction: 'up' | 'down') => {
    if (!activeTopicsPost) return;
    const currentTopics = [...(activeTopicsPost.topics || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= currentTopics.length) return;

    const temp = currentTopics[index];
    currentTopics[index] = currentTopics[targetIndex];
    currentTopics[targetIndex] = temp;

    const res = await reorderTopicsInPost(activeTopicsPost.id, currentTopics);
    if (res.success) {
      loadAllData();
    }
  };

  // Helper: Count questions under a post or topic
  const getQuestionCountForPost = (post: SubjectPost) => {
    return questions.filter((q) => {
      const qPost = (q.post || '').toLowerCase();
      const qSub = (q.subject || '').toLowerCase();
      const targetName = post.name.toLowerCase();
      return qPost.includes(targetName) || qSub.includes(targetName);
    }).length;
  };

  const getQuestionCountForTopic = (post: SubjectPost, topicName: string) => {
    return questions.filter((q) => {
      const qTopic = (q.topic || '').toLowerCase();
      const targetTopic = topicName.toLowerCase();
      return qTopic.includes(targetTopic) || targetTopic.includes(qTopic);
    }).length;
  };

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        post.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.tagline || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.topics || []).some((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' ? true : post.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [posts, searchTerm, statusFilter]);

  // Statistics
  const totalTopicsCount = useMemo(() => {
    return posts.reduce((acc, p) => acc + (p.topics?.length || 0), 0);
  }, [posts]);

  const activePostsCount = useMemo(() => {
    return posts.filter((p) => p.status === 'active').length;
  }, [posts]);

  // Render Icon helper
  const renderIcon = (iconName?: string, className = 'w-5 h-5') => {
    const found = ICON_OPTIONS.find((i) => i.name === iconName);
    const IconComp = found ? found.icon : BookOpen;
    return <IconComp className={className} />;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-2.5 text-xs font-black animate-slideDown ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
              : 'bg-rose-950 text-rose-300 border-rose-500/50'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl backdrop-blur-md relative overflow-hidden shadow-xl">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black">
            <Layers className="w-3.5 h-3.5" />
            <span>বিষয়ভিত্তিক প্রস্তুতি ও সিলেবাস মাস্টার</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            বিষয়ভিত্তিক পদ ও সিলেবাস ব্যবস্থাপনা
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            মাদ্রাসা আলিয়া ও ফাজিল-কামিল পর্যায় (আরবি প্রভাষক, সহকারী মৌলভী, সহকারী মৌলভী কারী, ইবতেদায়ী) এবং সাধারণ পদের সিলেবাস অধ্যায় পরিচালনা করুন। প্রশ্নব্যাংকে স্বয়ংক্রিয় ম্যাপিং হবে।
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={loadAllData}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition-colors"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreatePost}
            className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-950 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>নতুন পদ যুক্ত করুন</span>
          </button>
        </div>

        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400">মোট পদ (Total Posts)</p>
            <p className="text-xl font-black text-white">{posts.length} টি</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400">সক্রিয় পদ (Active Posts)</p>
            <p className="text-xl font-black text-teal-400">{activePostsCount} টি</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400">মোট সিলেবাস টপিক</p>
            <p className="text-xl font-black text-amber-400">{totalTopicsCount} টি অধ্যায়</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400">সংযুক্ত প্রশ্নসংখ্যা</p>
            <p className="text-xl font-black text-indigo-300">{questions.length}+ প্রশ্ন</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="পদ, কোড বা টপিকের নাম দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              সকল পদ ({posts.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              সক্রিয় ({activePostsCount})
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'draft'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ড্রাফট ({posts.length - activePostsCount})
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Subject Posts Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-3xl">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium">পদ ও সিলেবাস ডাটা লোড হচ্ছে...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <Layers className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-extrabold text-white">কোনো পদ পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            আপনার সার্চ ফিল্টারে কোনো পদ মিলেনি অথবা এখনও কোনো পদ তৈরি করা হয়নি।
          </p>
          <button
            onClick={handleOpenCreatePost}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
          >
            নতুন পদ তৈরি করুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPosts.map((post) => {
            const theme = COLOR_THEMES.find((c) => c.key === post.theme_color) || COLOR_THEMES[0];
            const qCount = getQuestionCountForPost(post);

            return (
              <div
                key={post.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between transition-all group"
              >
                {/* Post Header Banner */}
                <div>
                  <div className={`p-4 bg-gradient-to-r ${theme.gradient} text-white flex items-center justify-between`}>
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
                        {renderIcon(post.icon_name, 'w-5 h-5 text-white')}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black/25">
                          {post.code}
                        </span>
                        <h3 className="text-base font-black text-white leading-snug mt-0.5">
                          {post.name}
                        </h3>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTogglePostStatus(post)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer ${
                        post.status === 'active'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-900'
                          : 'bg-slate-900/80 text-slate-400 border border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {post.status === 'active' ? '● সক্রিয়' : '○ ড্রাফট'}
                    </button>
                  </div>

                  {/* Post Content Body */}
                  <div className="p-5 space-y-4">
                    {post.tagline && (
                      <p className="text-xs font-bold text-emerald-400 leading-snug">
                        {post.tagline}
                      </p>
                    )}

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {post.description || 'এই পদের অধীনে সিলেবাস অধ্যায় ও বিষয়ভিত্তিক প্রশ্নব্যাংক যুক্ত রয়েছে।'}
                    </p>

                    {/* Question & Topic count summary */}
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300 pt-1">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span>{post.topics?.length || 0} টি টপিক</span>
                      </span>

                      <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
                        <span>{qCount} টি প্রশ্ন</span>
                      </span>
                    </div>

                    {/* Preview of Top Topics */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        সিলেবাস অধ্যায়সমূহ:
                      </span>
                      {post.topics && post.topics.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-hidden">
                          {post.topics.slice(0, 4).map((top) => (
                            <span
                              key={top.id}
                              className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700"
                            >
                              {top.name}
                            </span>
                          ))}
                          {post.topics.length > 4 && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-400 text-[10px] font-bold">
                              +{post.topics.length - 4} আরও...
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic">
                          এখনও কোনো টপিক যুক্ত করা হয়নি।
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveTopicsPost(post)}
                    className="flex-1 py-2 px-3 bg-emerald-600/15 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 hover:border-emerald-500 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>সিলেবাস ও অধ্যায় ({post.topics?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditPost(post)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
                    title="পদ এডিট করুন"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() =>
                      setConfirmDeleteModal({
                        isOpen: true,
                        type: 'post',
                        postId: post.id,
                        title: post.name,
                      })
                    }
                    className="p-2 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-xl transition-colors border border-slate-700"
                    title="পদ মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Create / Edit Subject Post */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-scaleUp my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingPost ? 'পদের তথ্য সম্পাদনা করুন' : 'নতুন বিষয়ভিত্তিক পদ যোগ করুন'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    মাদ্রাসা বা সাধারণ পদের বিস্তারিত তথ্য নির্ধারণ করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-xs text-rose-300 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSavePost} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    পদের নাম (Post Name) *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="যেমন: আরবি প্রভাষক / সহকারী মৌলভী"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    পদ কোড (Code) *
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="যেমন: ARB-LEC"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-500 uppercase"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ট্যাগলাইন / সাব-শিরোনাম (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  placeholder="যেমন: ১৮তম ও ১৯তম শিক্ষক নিবন্ধন ও কামিল প্রস্তুতি"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  বিস্তারিত বর্ণনা (Description)
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={2}
                  placeholder="পদের উদ্দেশ্য, সিলেবাস কাঠামো ও প্রস্তুতি সংক্রান্ত নির্দেশনা..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Theme Color Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  থিম কালার ও গ্রেডিয়েন্ট (Color Theme)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COLOR_THEMES.map((theme) => {
                    const isSelected = formTheme === theme.key;
                    return (
                      <button
                        key={theme.key}
                        type="button"
                        onClick={() => setFormTheme(theme.key)}
                        className={`p-2 rounded-xl border text-[11px] font-bold flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/30 text-white'
                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${theme.gradient}`} />
                        <span className="truncate">{theme.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  আইকন প্রতীক (Icon)
                </label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((item) => {
                    const isSelected = formIcon === item.name;
                    const IconC = item.icon;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setFormIcon(item.name)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <IconC className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Radio */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">স্ট্যাটাস</label>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formStatus === 'active'}
                      onChange={() => setFormStatus('active')}
                      className="accent-emerald-500"
                    />
                    <span>সক্রিয় (Active - অ্যাপে দেখা যাবে)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-400">
                    <input
                      type="radio"
                      name="status"
                      value="draft"
                      checked={formStatus === 'draft'}
                      onChange={() => setFormStatus('draft')}
                      className="accent-emerald-500"
                    />
                    <span>ড্রাফট (Draft)</span>
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  বাতিল
                </button>

                <button
                  type="submit"
                  disabled={savingPost}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{savingPost ? 'সংরক্ষণ হচ্ছে...' : editingPost ? 'আপডেট করুন' : 'তৈরি করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Manage Syllabus Topics Drawer / Modal for Selected Post */}
      {activeTopicsPost && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl space-y-5 animate-scaleUp my-6 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                  <ListOrdered className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {activeTopicsPost.code}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">সিলেবাস ও অধ্যায় পরিচালনা</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                    {activeTopicsPost.name}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setActiveTopicsPost(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Scrollable Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-5">
              {/* Add New Topic Form Card */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <FolderPlus className="w-4 h-4 text-emerald-400" />
                  <span>নতুন সিলেবাস টপিক / অধ্যায় যোগ করুন</span>
                </h4>

                <form onSubmit={handleAddTopic} className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        placeholder="অধ্যায় বা টপিকের নাম (যেমন: ফিকহ ও উসুলুল ফিকহ)..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <button
                        type="submit"
                        disabled={!newTopicName.trim()}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-black rounded-xl shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>টপিক যুক্ত করুন</span>
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={newTopicDesc}
                    onChange={(e) => setNewTopicDesc(e.target.value)}
                    placeholder="টপিকের বিবরণ বা নম্বর বণ্টন (ঐচ্ছিক)..."
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                  />
                </form>
              </div>

              {/* Topics List Table / Cards */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                  <span>নির্ধারিত সিলেবাস অধ্যায়সমূহ ({activeTopicsPost.topics?.length || 0} টি)</span>
                  <span className="text-[11px] text-slate-500">তীর চিহ্ন দিয়ে ক্রম পরিবর্তন করুন</span>
                </div>

                {!activeTopicsPost.topics || activeTopicsPost.topics.length === 0 ? (
                  <div className="p-8 text-center bg-slate-800/40 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                    এখনও কোনো টপিক তৈরি করা হয়নি। উপরের ফর্ম থেকে সিলেবাস টপিক যোগ করুন।
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeTopicsPost.topics.map((topic, index) => {
                      const isEditing = editingTopic?.id === topic.id;
                      const qTopicCount = getQuestionCountForTopic(activeTopicsPost, topic.name);

                      if (isEditing) {
                        return (
                          <form
                            key={topic.id}
                            onSubmit={handleSaveTopicEdit}
                            className="p-3 bg-slate-800 border border-emerald-500 rounded-2xl space-y-2 animate-fadeIn"
                          >
                            <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                              <span>টপিক সম্পাদনা (Topic #{index + 1})</span>
                              <button
                                type="button"
                                onClick={() => setEditingTopic(null)}
                                className="text-slate-400 hover:text-white text-[11px]"
                              >
                                বাতিল
                              </button>
                            </div>

                            <input
                              type="text"
                              value={editingTopic.name}
                              onChange={(e) =>
                                setEditingTopic({ ...editingTopic, name: e.target.value })
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-emerald-500"
                              required
                            />

                            <input
                              type="text"
                              value={editingTopic.description || ''}
                              onChange={(e) =>
                                setEditingTopic({ ...editingTopic, description: e.target.value })
                              }
                              placeholder="টপিক বিবরণ..."
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                            />

                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="submit"
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
                              >
                                সেভ করুন
                              </button>
                            </div>
                          </form>
                        );
                      }

                      return (
                        <div
                          key={topic.id}
                          className="p-3 bg-slate-800/60 border border-slate-700/70 hover:border-slate-600 rounded-2xl flex items-center justify-between gap-3 group transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Order Number Badge */}
                            <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h5 className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                                  {topic.name}
                                </h5>
                                <span className="px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20 shrink-0">
                                  {qTopicCount} টি প্রশ্ন
                                </span>
                              </div>
                              {topic.description && (
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {topic.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Reorder Buttons */}
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveTopic(index, 'up')}
                              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 rounded-lg hover:bg-slate-700 transition-colors"
                              title="উপরে নিন"
                            >
                              <MoveUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={index === activeTopicsPost.topics.length - 1}
                              onClick={() => handleMoveTopic(index, 'down')}
                              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 rounded-lg hover:bg-slate-700 transition-colors"
                              title="নিচে নিন"
                            >
                              <MoveDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Topic */}
                            <button
                              type="button"
                              onClick={() => setEditingTopic(topic)}
                              className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-700 transition-colors"
                              title="টপিক এডিট করুন"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Topic */}
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDeleteModal({
                                  isOpen: true,
                                  type: 'topic',
                                  postId: activeTopicsPost.id,
                                  topicId: topic.id,
                                  title: topic.name,
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700 transition-colors"
                              title="টপিক মুছুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                মোট অধ্যায়: <strong>{activeTopicsPost.topics?.length || 0} টি</strong>
              </span>

              <button
                type="button"
                onClick={() => setActiveTopicsPost(null)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow"
              >
                সম্পন্ন হয়েছে
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        title={
          confirmDeleteModal.type === 'post'
            ? 'পদ মুছে ফেলতে চান?'
            : 'সিলেবাস টপিক মুছে ফেলতে চান?'
        }
        message={
          confirmDeleteModal.type === 'post'
            ? `আপনি কি নিশ্চিত যে "${confirmDeleteModal.title}" পদটি মুছে ফেলতে চান? এর অধীনে থাকা সকল সিলেবাস কনফিগারেশন মুছে যাবে।`
            : `আপনি কি নিশ্চিত যে "${confirmDeleteModal.title}" টপিকটি মুছে ফেলতে চান?`
        }
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
        onConfirm={handleConfirmDelete}
        onCancel={() =>
          setConfirmDeleteModal({ isOpen: false, type: 'post', postId: '', title: '' })
        }
      />
    </div>
  );
};
