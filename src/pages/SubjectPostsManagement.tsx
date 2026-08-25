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
  BookOpenCheck,
  BookMarked,
  ScrollText,
  Library,
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
  Database,
  Hash,
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
  THEME_COLOR_MAP,
  generateSlugId,
} from '../lib/subjectPostManager';
import { fetchAllQuestions, getSupabaseClient } from '../lib/supabase';
import { ConfirmModal } from '../components/ConfirmModal';

// Icon Map with requested icons
const ICON_OPTIONS = [
  { name: 'BookOpenCheck', label: 'বই ও টিক (BookOpenCheck)', icon: BookOpenCheck },
  { name: 'GraduationCap', label: 'শিক্ষা / প্রভাষক (GraduationCap)', icon: GraduationCap },
  { name: 'BookMarked', label: 'বুকমার্ক বই (BookMarked)', icon: BookMarked },
  { name: 'ScrollText', label: 'স্ক্রল টেক্সট (ScrollText)', icon: ScrollText },
  { name: 'Library', label: 'লাইব্রেরি (Library)', icon: Library },
  { name: 'BookOpen', label: 'খোলা বই (BookOpen)', icon: BookOpen },
  { name: 'Languages', label: 'ভাষা ও আরবি (Languages)', icon: Languages },
  { name: 'Award', label: 'ক্যাডার / পদ (Award)', icon: Award },
  { name: 'Briefcase', label: 'চাকরি / শিক্ষক (Briefcase)', icon: Briefcase },
  { name: 'Sparkles', label: 'কারী / স্পেশাল (Sparkles)', icon: Sparkles },
  { name: 'Layers', label: 'সিলেবাস / স্তর (Layers)', icon: Layers },
  { name: 'FileText', label: 'নোটস / শিট (FileText)', icon: FileText },
];

const COLOR_THEMES = [
  {
    hex: '#10B981',
    label: 'পান্না সবুজ (Emerald)',
    gradient: 'from-emerald-600 to-teal-500',
    gradient_class: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-emerald-500/25',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
  },
  {
    hex: '#0D9488',
    label: 'টিয়াল সায়ান (Teal)',
    gradient: 'from-teal-600 to-cyan-500',
    gradient_class: 'bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700 shadow-teal-500/25',
    bg: 'bg-teal-500/15',
    border: 'border-teal-500/40',
    text: 'text-teal-400',
  },
  {
    hex: '#6366F1',
    label: 'ইন্ডিগো পার্পল (Indigo)',
    gradient: 'from-indigo-600 to-purple-500',
    gradient_class: 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 shadow-indigo-500/25',
    bg: 'bg-indigo-500/15',
    border: 'border-indigo-500/40',
    text: 'text-indigo-400',
  },
  {
    hex: '#8B5CF6',
    label: 'রয়েল পার্পল (Purple)',
    gradient: 'from-purple-600 to-indigo-500',
    gradient_class: 'bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 shadow-purple-500/25',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/40',
    text: 'text-purple-400',
  },
  {
    hex: '#F59E0B',
    label: 'অ্যাম্বার গোল্ড (Amber)',
    gradient: 'from-amber-600 to-yellow-500',
    gradient_class: 'bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-700 shadow-amber-500/25',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
  },
  {
    hex: '#F43F5E',
    label: 'গোলাপী লাল (Rose)',
    gradient: 'from-rose-600 to-pink-500',
    gradient_class: 'bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700 shadow-rose-500/25',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/40',
    text: 'text-rose-400',
  },
  {
    hex: '#0284C7',
    label: 'স্কাই ব্লু (Sky Blue)',
    gradient: 'from-sky-500 via-blue-600 to-indigo-700',
    gradient_class: 'bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 shadow-blue-500/25',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/40',
    text: 'text-blue-400',
  },
];

export const SubjectPostsManagement: React.FC = () => {
  const [posts, setPosts] = useState<SubjectPost[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');
  const [dbSource, setDbSource] = useState<'supabase' | 'local'>('local');

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

  // Post Form State (Matching Supabase Schema)
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTheme, setFormTheme] = useState('#10B981');
  const [formIcon, setFormIcon] = useState('BookOpenCheck');
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
      setDbSource(postsRes.source);
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

    // Listen to local dispatch updates
    const handleUpdate = () => {
      fetchSubjectPosts().then((res) => {
        setPosts(res.posts);
        setDbSource(res.source);
      });
    };
    window.addEventListener('subject_posts_updated', handleUpdate);

    // Supabase Real-time Channel Listener
    const client = getSupabaseClient();
    let channel: any = null;
    if (client) {
      try {
        channel = client
          .channel('subject_posts_live')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'subject_posts' },
            () => {
              loadAllData();
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('Realtime channel error:', e);
      }
    }

    return () => {
      window.removeEventListener('subject_posts_updated', handleUpdate);
      if (channel && client) {
        client.removeChannel(channel);
      }
    };
  }, []);

  // Sync activeTopicsPost if posts change
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
    setFormId('');
    setFormName('');
    setFormCode('৩০০');
    setFormTagline('মাদ্রাসা ও কলেজ পর্যায়');
    setFormBadge('');
    setFormSubtitle('');
    setFormDesc('');
    setFormTheme('#10B981');
    setFormIcon('BookOpenCheck');
    setFormStatus('active');
    setFormError(null);
    setIsPostModalOpen(true);
  };

  // Open Post Edit Modal
  const handleOpenEditPost = (post: SubjectPost) => {
    setEditingPost(post);
    setFormId(post.id);
    setFormName(post.name);
    setFormCode(post.code || '');
    setFormTagline(post.tagline || '');
    setFormBadge(post.badge || `${post.name} • কোড: ${post.code || 'আবশ্যিক'}`);
    setFormSubtitle(post.subtitle || '');
    setFormDesc(post.description || '');
    setFormTheme(post.theme_color || '#10B981');
    setFormIcon(post.icon_name || 'BookOpenCheck');
    setFormStatus(post.status || 'active');
    setFormError(null);
    setIsPostModalOpen(true);
  };

  // Auto-generate badge when name or code changes
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!formId && !editingPost) {
      setFormId(generateSlugId(val));
    }
    if (!formBadge || formBadge.includes('• কোড:')) {
      setFormBadge(`${val.trim()} • কোড: ${formCode.trim() || 'আবশ্যিক'}`);
    }
  };

  const handleCodeChange = (val: string) => {
    setFormCode(val);
    if (formName.trim()) {
      setFormBadge(`${formName.trim()} • কোড: ${val.trim() || 'আবশ্যিক'}`);
    }
  };

  // Save Post (Create / Update in Supabase `subject_posts`)
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('পদের নাম অবশ্যই প্রদান করতে হবে।');
      return;
    }

    setSavingPost(true);
    setFormError(null);

    const themeConfig = THEME_COLOR_MAP[formTheme] || THEME_COLOR_MAP['#10B981'];
    const generatedSlug = formId.trim() ? generateSlugId(formName, formId) : generateSlugId(formName);
    const computedBadge = formBadge.trim() || `${formName.trim()} • কোড: ${formCode.trim() || 'আবশ্যিক'}`;

    try {
      if (editingPost) {
        const res = await updateSubjectPost(editingPost.id, {
          name: formName.trim(),
          code: formCode.trim(),
          tagline: formTagline.trim(),
          badge: computedBadge,
          subtitle: formSubtitle.trim(),
          description: formDesc.trim(),
          theme_color: formTheme,
          gradient_class: themeConfig.gradient_class,
          icon_name: formIcon,
          status: formStatus,
        });

        if (res.success) {
          showToast('Supabase-এ পদটির তথ্য সফলভাবে আপডেট হয়েছে!');
          setIsPostModalOpen(false);
          loadAllData();
        } else {
          setFormError(res.error || 'আপডেট করতে সমস্যা হয়েছে।');
        }
      } else {
        const res = await createSubjectPost({
          id: generatedSlug,
          name: formName.trim(),
          code: formCode.trim(),
          tagline: formTagline.trim(),
          badge: computedBadge,
          subtitle: formSubtitle.trim(),
          description: formDesc.trim(),
          theme_color: formTheme,
          gradient_class: themeConfig.gradient_class,
          icon_name: formIcon,
          status: formStatus,
          order_index: posts.length + 1,
          topics: [],
        });

        if (res.success) {
          showToast('Supabase `subject_posts` টেবিলে নতুন পদ সফলভাবে যুক্ত হয়েছে!');
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

  // Delete Post from Supabase
  const handleConfirmDelete = async () => {
    if (confirmDeleteModal.type === 'post') {
      const res = await deleteSubjectPost(confirmDeleteModal.postId);
      if (res.success) {
        showToast('Supabase থেকে পদটি সফলভাবে মুছে ফেলা হয়েছে।');
        if (activeTopicsPost?.id === confirmDeleteModal.postId) {
          setActiveTopicsPost(null);
        }
        loadAllData();
      }
    } else if (confirmDeleteModal.type === 'topic' && confirmDeleteModal.topicId) {
      const res = await deleteTopicFromPost(confirmDeleteModal.postId, confirmDeleteModal.topicId);
      if (res.success) {
        showToast('সিলেবাস টপিকটি সফলভাবে মুছে ফেলা হয়েছে।');
        loadAllData();
      }
    }
    setConfirmDeleteModal({ isOpen: false, type: 'post', postId: '', title: '' });
  };

  // Add Topic to Post and Sync to Supabase `subject_posts.topics`
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
      showToast('সিলেবাস টপিক Supabase-এ সফলভাবে সংরক্ষিত হয়েছে!');
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
      showToast('টপিক তথ্য আপডেট করা হয়েছে!');
      loadAllData();
    } else {
      showToast(res.error || 'টপিক আপডেট ব্যর্থ হয়েছে।', 'error');
    }
  };

  // Reorder Topics (Move Up/Down)
  const handleMoveTopic = async (topicId: string, direction: 'up' | 'down') => {
    if (!activeTopicsPost || !activeTopicsPost.topics) return;
    const list = [...activeTopicsPost.topics];
    const idx = list.findIndex((t) => t.id === topicId);
    if (idx === -1) return;

    if (direction === 'up' && idx > 0) {
      const temp = list[idx];
      list[idx] = list[idx - 1];
      list[idx - 1] = temp;
    } else if (direction === 'down' && idx < list.length - 1) {
      const temp = list[idx];
      list[idx] = list[idx + 1];
      list[idx + 1] = temp;
    }

    const res = await reorderTopicsInPost(activeTopicsPost.id, list);
    if (res.success) {
      loadAllData();
    }
  };

  // Helper: calculate total questions count for a post
  const getQuestionCountForPost = (post: SubjectPost) => {
    return questions.filter((q) => {
      const postNameMatches = q.post?.toLowerCase().trim() === post.name.toLowerCase().trim();
      const codeMatches = q.post?.toLowerCase().includes(post.code?.toLowerCase() || '___');
      const subjectMatches = q.subject?.toLowerCase().includes(post.name.toLowerCase());
      return postNameMatches || codeMatches || subjectMatches;
    }).length;
  };

  // Helper: calculate total questions count for a topic
  const getQuestionCountForTopic = (post: SubjectPost, topicName: string) => {
    return questions.filter((q) => {
      const topicMatches = q.topic?.toLowerCase().trim() === topicName.toLowerCase().trim();
      return topicMatches;
    }).length;
  };

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        post.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.tagline && post.tagline.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (post.description && post.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || post.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [posts, searchTerm, statusFilter]);

  const activePostsCount = posts.filter((p) => p.status === 'active').length;

  const renderIcon = (iconName?: string, className = 'w-5 h-5') => {
    const found = ICON_OPTIONS.find((i) => i.name === iconName);
    const IconComponent = found ? found.icon : BookOpenCheck;
    return <IconComponent className={className} />;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-black animate-scaleUp ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-500/50'
              : 'bg-rose-950 text-rose-200 border-rose-500/50'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" /> Supabase: `subject_posts` লাইভ সিঙ্ক
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              উৎস: <strong className="text-emerald-400 uppercase">{dbSource}</strong>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-emerald-400" />
            <span>বিষয়ভিত্তিক পদ ও সিলেবাস ব্যবস্থাপনা</span>
          </h1>

          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            মাদ্রাসা ও সাধারণ শিক্ষক নিবন্ধনের সকল পদ, কোড, ট্যাগলাইন এবং সিলেবাসের অধ্যায়সমূহ সরাসরি Supabase ডাটাবেসে পরিচালনা করুন।
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition-all cursor-pointer shadow flex items-center gap-2 text-xs font-bold"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">রিফ্রেশ</span>
          </button>

          <button
            onClick={handleOpenCreatePost}
            className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-950 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>নতুন পদ যুক্ত করুন</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="পদের নাম, কোড বা বিষয় দিয়ে খুঁজুন..."
            className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
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
          <p className="text-xs font-medium">Supabase থেকে পদ ও সিলেবাস ডাটা লোড হচ্ছে...</p>
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
            const theme = COLOR_THEMES.find((c) => c.hex === post.theme_color) || COLOR_THEMES[0];
            const qCount = getQuestionCountForPost(post);

            return (
              <div
                key={post.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between transition-all group"
              >
                {/* Post Header Banner */}
                <div>
                  <div className={`p-4 ${post.gradient_class || theme.gradient_class} text-white flex items-center justify-between`}>
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
                        {renderIcon(post.icon_name, 'w-5 h-5 text-white')}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black/30">
                            কোড: {post.code || 'আবশ্যিক'}
                          </span>
                          <span className="text-[9px] font-mono text-white/80 bg-black/20 px-1.5 py-0.5 rounded">
                            {post.id}
                          </span>
                        </div>
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
                    {post.badge && (
                      <div className="inline-block px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[11px] font-extrabold text-emerald-400">
                        {post.badge}
                      </div>
                    )}

                    {post.tagline && (
                      <p className="text-xs font-bold text-slate-300 leading-snug">
                        {post.tagline}
                      </p>
                    )}

                    {post.subtitle && (
                      <p className="text-xs text-slate-400 italic">
                        {post.subtitle}
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
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-700 shadow-sm"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>সিলেবাস টপিক ({post.topics?.length || 0})</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditPost(post)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="পদ এডিট করুন"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() =>
                        setConfirmDeleteModal({
                          isOpen: true,
                          type: 'post',
                          postId: post.id,
                          title: `"${post.name}" পদটি মুছে ফেলতে চান?`,
                        })
                      }
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors"
                      title="পদ মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Create / Edit Subject Post */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-scaleUp my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  {editingPost ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingPost ? 'পদের তথ্য সম্পাদন ও Supabase আপডেট' : 'নতুন পদ তৈরি ও Supabase-এ সংযোজন'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    টেবিল: <code className="text-emerald-400">subject_posts</code>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsPostModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs font-bold text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSavePost} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Post ID / Slug */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-emerald-400" />
                    <span>আইডি / Slug Identifier (id)</span>
                  </label>
                  <input
                    type="text"
                    value={formId}
                    disabled={Boolean(editingPost)}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="e.g. arabic_lecturer, math_teacher"
                    className="w-full bg-slate-800/90 border border-slate-700 disabled:opacity-60 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {editingPost ? 'আইডি পরিবর্তনযোগ্য নয়' : 'ফাঁকা রাখলে স্বয়ংক্রিয় স্ল্যাগ তৈরি হবে'}
                  </span>
                </div>

                {/* Post Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    পদ কোড (Code)
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="যেমন: ৩০০, ৩১১, আবশ্যিক"
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Post Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  পদের নাম (Name) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="যেমন: আরবি প্রভাষক প্রস্তুতি"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tagline */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    ট্যাগলাইন / পর্যায় (Tagline)
                  </label>
                  <input
                    type="text"
                    value={formTagline}
                    onChange={(e) => setFormTagline(e.target.value)}
                    placeholder="যেমন: মাদ্রাসা ও কলেজ পর্যায়"
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Badge */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    ব্যাজ টেক্সট (Badge)
                  </label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="যেমন: প্রভাষক আরবি • কোড: ৩০০"
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  সাবটাইটেল / সারসংক্ষেপ (Subtitle)
                </label>
                <input
                  type="text"
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  placeholder="যেমন: আরবি সাহিত্য, বালাগাত, নাহু ও উলুমুল কুরআন প্রস্তুতি"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  পদের বিবরণ (Description)
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="পদের জন্য সাধারণ বিবরণ ও দিকনির্দেশনা..."
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Theme Color Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  থিম কালার ও গ্র্যাডিয়েন্ট (Theme Color & Gradient Class)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COLOR_THEMES.map((theme) => {
                    const isSelected = formTheme === theme.hex;
                    return (
                      <button
                        key={theme.hex}
                        type="button"
                        onClick={() => setFormTheme(theme.hex)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/40 text-white'
                            : 'bg-slate-850 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded-full shrink-0 shadow"
                          style={{ backgroundColor: theme.hex }}
                        />
                        <span className="text-[11px] font-bold truncate">{theme.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  আইকন প্রতীক (Icon Name)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ICON_OPTIONS.map((item) => {
                    const isSelected = formIcon === item.name;
                    const IconC = item.icon;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setFormIcon(item.name)}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <IconC className="w-4 h-4 shrink-0" />
                        <span className="text-[11px] truncate">{item.name}</span>
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
                  <span>{savingPost ? 'Supabase-এ সেভ হচ্ছে...' : editingPost ? 'আপডেট করুন' : 'তৈরি করুন'}</span>
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
                  <span>নতুন সিলেবাস টপিক / অধ্যায় যোগ করুন (Supabase synced)</span>
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
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-100 focus:outline-none"
                              required
                            />

                            <input
                              type="text"
                              value={editingTopic.description || ''}
                              onChange={(e) =>
                                setEditingTopic({ ...editingTopic, description: e.target.value })
                              }
                              placeholder="টপিক বিবরণ..."
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                            />

                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingTopic(null)}
                                className="px-3 py-1 rounded-lg bg-slate-700 text-slate-300 text-xs"
                              >
                                বাতিল
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
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
                          className="bg-slate-800/90 border border-slate-700/70 hover:border-slate-600 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-slate-700 text-slate-300 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            <div>
                              <h5 className="text-xs font-extrabold text-white leading-snug">
                                {topic.name}
                              </h5>
                              {topic.description && (
                                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                                  {topic.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-emerald-400 font-bold">
                                <span>{qTopicCount} টি যুক্ত প্রশ্ন</span>
                              </div>
                            </div>
                          </div>

                          {/* Reorder and Action buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveTopic(topic.id, 'up')}
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-slate-300 transition-colors"
                              title="উপরে নিন"
                            >
                              <MoveUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={index === (activeTopicsPost.topics?.length || 0) - 1}
                              onClick={() => handleMoveTopic(topic.id, 'down')}
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-slate-300 transition-colors"
                              title="নিচে নিন"
                            >
                              <MoveDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingTopic(topic)}
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                              title="টপিক এডিট করুন"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDeleteModal({
                                  isOpen: true,
                                  type: 'topic',
                                  postId: activeTopicsPost.id,
                                  topicId: topic.id,
                                  title: `"${topic.name}" টপিকটি মুছে ফেলতে চান?`,
                                })
                              }
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-rose-900 text-slate-400 hover:text-rose-300 transition-colors"
                              title="টপিক ডিলিট করুন"
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
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-400">
              <span>মোট টপিক: <strong className="text-white">{activeTopicsPost.topics?.length || 0} টি</strong></span>
              <button
                onClick={() => setActiveTopicsPost(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
              >
                সম্পন্ন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        title={confirmDeleteModal.title}
        message="আপনি কি নিশ্চিত? এই পদ বা টপিকটি মুছে ফেললে Supabase ডাটাবেস থেকে স্থায়ীভাবে মুছে যাবে।"
        confirmText="মুছে ফেলুন"
        cancelText="বাতিল"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteModal({ isOpen: false, type: 'post', postId: '', title: '' })}
      />
    </div>
  );
};
