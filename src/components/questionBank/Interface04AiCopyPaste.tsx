import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Info,
  FileText,
  UploadCloud,
  Trash2,
  ArrowRight,
  Plus,
  Layers,
  FolderTree,
} from 'lucide-react';
import { WorkingQuestion } from '../../types/questionBank';
import { QuestionBankHeader } from './Header';
import { StepIndicator } from './StepIndicator';
import { SmartBatchPrefixCard } from './SmartBatchPrefixCard';
import { AddCategoryModal, AddCategoryPayload } from './AddCategoryModal';
import {
  isArabicText,
  parsePastedQuestionsText,
} from '../../lib/questionBankEngine';
import { Question } from '../../types';
import { BASE_POSTS, getCustomPosts, addCustomPost } from '../../lib/postManager';
import {
  SubjectItem,
  TopicItem,
  fetchSubjects,
  fetchTopics,
  filterTopicsForSubject,
  addSubject,
  addTopic,
  suggestSubjectCode,
  suggestMainTopicCode,
  suggestSubTopicCode,
  constructSmartBatchPrefix,
  computeNextSequenceForPrefix,
} from '../../lib/subjectTopicManager';

interface Interface04AiCopyPasteProps {
  existingQuestions: Question[];
  onBack: () => void;
  onProceedToPreview: (parsedQuestions: WorkingQuestion[], meta: any) => void;
}

const SAMPLE_PASTE_TEXT = `১. জাতিসংঘ নিরাপত্তা পরিষদের স্থায়ী সদস্য রাষ্ট্র কয়টি?
A. ৫ টি
B. ১০ টি
C. ১৫ টি
D. ৭ টি
উত্তর: A
ব্যাখ্যা: জাতিসংঘ নিরাপত্তা পরিষদের স্থায়ী সদস্য ৫টি (যুক্তরাষ্ট্র, যুক্তরাজ্য, রাশিয়া, ফ্রান্স, চীন) এবং অস্থায়ী সদস্য ১০টি।

২. সুইজারল্যান্ডের জেনেভায় কোন সংস্থার সদর দপ্তর অবস্থিত?
A. WHO ও WTO
B. NATO
C. UNESCO
D. ASEAN
উত্তর: A
ব্যাখ্যা: বিশ্ব স্বাস্থ্য সংস্থা (WHO) ও বিশ্ব বাণিজ্য সংস্থা (WTO)-এর সদর দপ্তর জেনেভায় অবস্থিত।

৩. ما هي عاصمة جمهورية بنغلاديش الشعبية؟
A. دكا
B. شيتاغونغ
C. سلهت
D. خولنا
উত্তর: A
ব্যাখ্যা: دكا هي عاصمة بنغلاديش.`;

export const Interface04AiCopyPaste: React.FC<Interface04AiCopyPasteProps> = ({
  existingQuestions,
  onBack,
  onProceedToPreview,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [pastedText, setPastedText] = useState(SAMPLE_PASTE_TEXT);
  const [isRtlManual, setIsRtlManual] = useState<boolean | null>(null);

  // 3-Level Hierarchical Data State
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>([]);
  const [topicsList, setTopicsList] = useState<TopicItem[]>([]);
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(true);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedMainTopicId, setSelectedMainTopicId] = useState<string>('');
  const [selectedSubTopicId, setSelectedSubTopicId] = useState<string>('');

  // Other Metadata
  const [post, setPost] = useState('বিসিএস ক্যাডার (BCS)');
  const [language, setLanguage] = useState<'বাংলা' | 'English' | 'العربية'>('বাংলা');
  const [questionType, setQuestionType] = useState('MCQ (একটি সঠিক উত্তর)');
  const [difficulty, setDifficulty] = useState<'সহজ' | 'মাঝারি' | 'কঠিন'>('মাঝারি');

  const [allPosts, setAllPosts] = useState<string[]>([]);
  const [addModalType, setAddModalType] = useState<'subject' | 'topic' | 'subtopic' | 'post' | null>(null);

  // Dynamic Prefix State
  const [prefix, setPrefix] = useState('Q-GK-INT-01-');
  const [nextNumber, setNextNumber] = useState(1);
  const [isPrefixCustomized, setIsPrefixCustomized] = useState(false);

  // 1. Initial Load: Fetch Subjects and Topics
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoadingHierarchy(true);
      try {
        const [subs, tops] = await Promise.all([fetchSubjects(), fetchTopics()]);
        if (isMounted) {
          setSubjectsList(subs);
          setTopicsList(tops);

          // Default selection to International Affairs (GK-INT) if available
          const defaultSub = subs.find((s) => s.code === 'ENG-GRM') || subs.find((s) => s.code === 'GK-INT') || subs[0];
          if (defaultSub) {
            setSelectedSubjectId(defaultSub.id);
            const mainsForSub = filterTopicsForSubject(tops, defaultSub.id).filter(
              (t) => !t.parent_id || t.parent_id === null
            );
            if (mainsForSub.length > 0) {
              setSelectedMainTopicId(mainsForSub[0].id);
              const subsForMain = tops.filter((t) => String(t.parent_id) === String(mainsForSub[0].id));
              if (subsForMain.length > 0) {
                setSelectedSubTopicId(subsForMain[0].id);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading hierarchical subjects/topics:', err);
      } finally {
        if (isMounted) setIsLoadingHierarchy(false);
      }
    };

    loadData();

    const customPosts = getCustomPosts();
    setAllPosts(Array.from(new Set([...BASE_POSTS, ...customPosts])));

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered Main Topics (parent_id is null / undefined) for current subject
  const currentMainTopics = filterTopicsForSubject(topicsList, selectedSubjectId).filter(
    (t) => !t.parent_id || t.parent_id === null
  );

  // Filtered Sub-Topics (parent_id === selectedMainTopicId)
  const currentSubTopics = topicsList.filter(
    (t) => Boolean(selectedMainTopicId) && String(t.parent_id) === String(selectedMainTopicId)
  );

  const currentSubject = subjectsList.find((s) => String(s.id) === String(selectedSubjectId));
  const currentMainTopic = topicsList.find((t) => String(t.id) === String(selectedMainTopicId));
  const currentSubTopic = topicsList.find((t) => String(t.id) === String(selectedSubTopicId));

  // 2. Dynamic Smart Batch Prefix update when Subject / Topic / Sub-Topic changes
  const updatePrefixAndSequence = useCallback(() => {
    if (isPrefixCustomized) return;

    const generatedPrefix = constructSmartBatchPrefix(
      currentSubject?.code,
      currentMainTopic?.code,
      currentSubTopic?.code
    );

    setPrefix(generatedPrefix);
    const seq = computeNextSequenceForPrefix(generatedPrefix, existingQuestions);
    setNextNumber(seq);
  }, [currentSubject, currentMainTopic, currentSubTopic, existingQuestions, isPrefixCustomized]);

  useEffect(() => {
    updatePrefixAndSequence();
  }, [updatePrefixAndSequence]);

  // Handle Subject Change with Cascading Reset
  const handleSubjectChange = (newSubjectId: string) => {
    setSelectedSubjectId(newSubjectId);
    setIsPrefixCustomized(false);

    // Filter main topics for the new subject
    const mains = filterTopicsForSubject(topicsList, newSubjectId).filter(
      (t) => !t.parent_id || t.parent_id === null
    );

    if (mains.length > 0) {
      setSelectedMainTopicId(mains[0].id);
      const subs = topicsList.filter((t) => String(t.parent_id) === String(mains[0].id));
      setSelectedSubTopicId(subs.length > 0 ? subs[0].id : '');
    } else {
      setSelectedMainTopicId('');
      setSelectedSubTopicId('');
    }
  };

  // Handle Main Topic Change with Cascading Reset
  const handleMainTopicChange = (newMainTopicId: string) => {
    setSelectedMainTopicId(newMainTopicId);
    setIsPrefixCustomized(false);

    const subs = topicsList.filter((t) => String(t.parent_id) === String(newMainTopicId));
    setSelectedSubTopicId(subs.length > 0 ? subs[0].id : '');
  };

  // Handle Sub-Topic Change
  const handleSubTopicChange = (newSubTopicId: string) => {
    setSelectedSubTopicId(newSubTopicId);
    setIsPrefixCustomized(false);
  };

  // Manual Prefix overrides
  const handlePrefixChange = (newP: string) => {
    setIsPrefixCustomized(true);
    setPrefix(newP);
  };

  const handleNextNumberChange = (newN: number) => {
    setNextNumber(newN);
  };

  const handleRefreshPrefix = () => {
    setIsPrefixCustomized(false);
    updatePrefixAndSequence();
  };

  // Add Category Handler (Subject, Main Topic, Sub-Topic, Post)
  const handleAddNewCategoryItem = async (payload: string | AddCategoryPayload) => {
    if (addModalType === 'subject') {
      const name = typeof payload === 'string' ? payload : payload.name;
      const code = typeof payload === 'object' ? payload.code : undefined;
      const res = await addSubject(name, code);
      if (res.success && res.data) {
        setSubjectsList((prev) => [...prev.filter((s) => s.id !== res.data!.id), res.data!]);
        setSelectedSubjectId(res.data.id);
        setSelectedMainTopicId('');
        setSelectedSubTopicId('');
        setIsPrefixCustomized(false);
      }
    } else if (addModalType === 'topic') {
      const title = typeof payload === 'string' ? payload : payload.name;
      const code =
        typeof payload === 'object' && payload.code
          ? payload.code
          : suggestMainTopicCode(currentSubject?.code || 'SUB', topicsList);

      if (selectedSubjectId) {
        const res = await addTopic(selectedSubjectId, title, code, null);
        if (res.success && res.data) {
          setTopicsList((prev) => [...prev, res.data!]);
          setSelectedMainTopicId(res.data.id);
          setSelectedSubTopicId('');
          setIsPrefixCustomized(false);
        }
      }
    } else if (addModalType === 'subtopic') {
      const title = typeof payload === 'string' ? payload : payload.name;
      const code =
        typeof payload === 'object' && payload.code
          ? payload.code
          : suggestSubTopicCode(currentMainTopic?.code || 'TOP', topicsList);

      if (selectedSubjectId && selectedMainTopicId) {
        const res = await addTopic(selectedSubjectId, title, code, selectedMainTopicId);
        if (res.success && res.data) {
          setTopicsList((prev) => [...prev, res.data!]);
          setSelectedSubTopicId(res.data.id);
          setIsPrefixCustomized(false);
        }
      }
    } else if (addModalType === 'post') {
      const cleanName = (typeof payload === 'string' ? payload : payload.name).replace(/\s+/g, ' ').trim();
      addCustomPost(cleanName);
      setAllPosts((prev) => Array.from(new Set([...prev, cleanName])));
      setPost(cleanName);
    }
  };

  const isArabicDetected = isArabicText(pastedText);
  const isRtl = isRtlManual !== null ? isRtlManual : isArabicDetected;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPastedText(content);
        setActiveTab('text');
      }
    };
    reader.readAsText(file);
  };

  const handleParseAndProceed = () => {
    if (!pastedText.trim()) return;

    const subjectName = currentSubject?.name || 'আন্তর্জাতিক বিষয়াবলি';
    const topicName = currentMainTopic?.title || 'সাধারণ টপিক';
    const subTopicName = currentSubTopic?.title || '';
    const cleanPost = (post || '').replace(/\s+/g, ' ').trim();

    const parsed = parsePastedQuestionsText(pastedText, {
      subject: subjectName,
      topic: topicName,
      sub_topic: subTopicName,
      subject_id: selectedSubjectId,
      topic_id: selectedMainTopicId,
      sub_topic_id: selectedSubTopicId,
      post: cleanPost,
      language,
      questionType,
      difficulty,
    });

    onProceedToPreview(parsed, {
      subject: subjectName,
      topic: topicName,
      sub_topic: subTopicName,
      subject_id: selectedSubjectId,
      topic_id: selectedMainTopicId,
      sub_topic_id: selectedSubTopicId,
      subject_code: currentSubject?.code,
      topic_code: currentMainTopic?.code,
      sub_topic_code: currentSubTopic?.code,
      post: cleanPost,
      language,
      questionType,
      difficulty,
      prefix,
      nextNumber,
    });
  };

  // Generate context metadata for modal
  const getModalParentContext = () => {
    if (addModalType === 'topic') {
      return {
        subjectName: currentSubject?.name,
        subjectCode: currentSubject?.code,
        suggestedCode: suggestMainTopicCode(currentSubject?.code || 'SUB', topicsList),
      };
    }
    if (addModalType === 'subtopic') {
      return {
        subjectName: currentSubject?.name,
        subjectCode: currentSubject?.code,
        parentTopicName: currentMainTopic?.title,
        parentTopicCode: currentMainTopic?.code,
        suggestedCode: suggestSubTopicCode(currentMainTopic?.code || 'TOP', topicsList),
      };
    }
    if (addModalType === 'subject') {
      return {
        suggestedCode: suggestSubjectCode('', subjectsList),
      };
    }
    return undefined;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      {/* 1. Header */}
      <QuestionBankHeader
        showBack
        onBack={onBack}
        title="মাস্টার প্রশ্ন ব্যাংক"
        subTitle="QUESTION BANK"
      />

      {/* 2. Step Indicator */}
      <StepIndicator
        currentStep={1}
        step1Label="কপি-পেস্ট করুন"
        step2Label="প্রিভিউ ও যুক্ত করুন"
      />

      {/* 3. Basic Information Card: 3-Level Hierarchy (Subject -> Topic -> Sub-Topic) */}
      <div className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-black text-white">প্রশ্নের মৌলিক তথ্য (3-লেভেল ক্যাটাগরি)</h2>
            <Info className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
            {currentSubject?.code || 'SUB'} → {currentMainTopic?.code || 'TOP'} {currentSubTopic ? `→ ${currentSubTopic.code}` : ''}
          </span>
        </div>
        <p className="text-xs text-slate-400 -mt-2">
          বিষয়, মূল টপিক ও সাব-টপিক নির্বাচন করুন। কোড অনুযায়ী স্বয়ংক্রিয়ভাবে স্মার্ট প্রিফিক্স জেনারেট হবে।
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {/* Level 1: Subject Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">১. বিষয় (Subject) *</label>
              <button
                type="button"
                onClick={() => setAddModalType('subject')}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>নতুন যুক্ত</span>
              </button>
            </div>
            <select
              value={selectedSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              disabled={isLoadingHierarchy}
              className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
            >
              {subjectsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Level 2: Main Topic Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">২. মূল টপিক (Main Topic) *</label>
              <button
                type="button"
                onClick={() => setAddModalType('topic')}
                disabled={!selectedSubjectId}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 disabled:opacity-40"
              >
                <Plus className="w-3 h-3" />
                <span>নতুন যুক্ত</span>
              </button>
            </div>
            <select
              value={selectedMainTopicId}
              onChange={(e) => handleMainTopicChange(e.target.value)}
              disabled={isLoadingHierarchy || currentMainTopics.length === 0}
              className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
            >
              {currentMainTopics.length === 0 ? (
                <option value="">কোনো মূল টপিক পাওয়া যায়নি (নতুন যুক্ত করুন)</option>
              ) : (
                currentMainTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.code})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Level 3: Sub-Topic Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">৩. সাব-টপিক (Sub-Topic)</label>
              <button
                type="button"
                onClick={() => setAddModalType('subtopic')}
                disabled={!selectedMainTopicId}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 disabled:opacity-40"
              >
                <Plus className="w-3 h-3" />
                <span>নতুন যুক্ত</span>
              </button>
            </div>
            <select
              value={selectedSubTopicId}
              onChange={(e) => handleSubTopicChange(e.target.value)}
              disabled={isLoadingHierarchy || !selectedMainTopicId}
              className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
            >
              <option value="">-- সকল সাব-টপিক / সাধারণ --</option>
              {currentSubTopics.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.title} ({st.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Smart Batch Prefix Card (Auto Prefix Formula based on Subject/Topic/SubTopic Code) */}
      <SmartBatchPrefixCard
        prefix={prefix}
        nextNumber={nextNumber}
        subjectName={
          currentSubTopic
            ? `${currentSubTopic.title} (${currentSubTopic.code})`
            : currentMainTopic
            ? `${currentMainTopic.title} (${currentMainTopic.code})`
            : currentSubject?.name
        }
        onPrefixChange={handlePrefixChange}
        onNextNumberChange={handleNextNumberChange}
        onRefresh={handleRefreshPrefix}
      />

      {/* 5. AI Copy-Paste Section */}
      <div className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">AI কপি-পেস্ট (Copy-Paste)</h3>
              <p className="text-xs text-slate-400">আপনার প্রশ্ন/অপশন এখানে পেস্ট করুন</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-[#050914] p-1 rounded-2xl border border-slate-800 flex items-center">
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'text'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                টেক্সট পেস্ট
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('file')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'file'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ফাইল আপলোড
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Text Area */}
        {activeTab === 'text' ? (
          <div className="space-y-2">
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={12}
              dir="ltr"
              placeholder="এখানে আপনার প্রশ্ন পেস্ট করুন..."
              className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl p-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed font-mono text-left"
            />
          </div>
        ) : (
          /* Tab 2: File Upload */
          <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-3xl p-8 text-center bg-[#050914] space-y-3 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                ফাইল টেনে আনুন অথবা ক্লিক করে আপলোড করুন
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                সমর্থিত ফাইল: .txt, .csv, .docx, .json
              </p>
            </div>
            <label className="inline-block cursor-pointer">
              <input
                type="file"
                accept=".txt,.csv,.json,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-emerald-400 inline-flex items-center gap-1.5 transition-all">
                <FileText className="w-3.5 h-3.5" />
                <span>ফাইল সিলেক্ট করুন</span>
              </span>
            </label>
          </div>
        )}

        {/* Formatting Guide Box */}
        <div className="bg-[#050914] border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
          <span className="font-bold text-white block">পেস্ট করার নিয়মাবলী:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              <span>প্রতিটি প্রশ্ন নতুন নম্বরে বা লাইনে লিখুন</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              <span>অপশনগুলো A, B, C, D বা ক, খ, গ, ঘ ফরম্যাটে দিন</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              <span>সঠিক উত্তর চিহ্নিত করুন (যেমন: Ans: A বা উত্তর: ক)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              <span>ব্যাখ্যা থাকলে আলাদা লাইনে দিন (যেমন: ব্যাখ্যা: ...)</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setPastedText('')}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>ক্লিয়ার করুন</span>
          </button>

          <button
            type="button"
            onClick={handleParseAndProceed}
            disabled={!pastedText.trim()}
            className="w-full sm:w-auto flex-1 py-4 px-6 rounded-3xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-[0.99] disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>AI পার্স করুন (পরবর্তী ধাপ)</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {addModalType && (
        <AddCategoryModal
          isOpen={Boolean(addModalType)}
          type={addModalType}
          parentContext={getModalParentContext()}
          onClose={() => setAddModalType(null)}
          onAdd={handleAddNewCategoryItem}
        />
      )}
    </div>
  );
};
