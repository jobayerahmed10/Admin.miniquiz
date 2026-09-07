import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Info,
  Bot,
  ArrowRight,
  Plus,
  Minus,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FolderTree,
} from 'lucide-react';
import { WorkingQuestion, AiAutoGenerateConfig } from '../../types/questionBank';
import { QuestionBankHeader } from './Header';
import { StepIndicator } from './StepIndicator';
import { SmartBatchPrefixCard } from './SmartBatchPrefixCard';
import { AddCategoryModal, AddCategoryPayload } from './AddCategoryModal';
import {
  generateAiQuestions,
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

interface Interface06AiAutoGenerateProps {
  existingQuestions: Question[];
  onBack: () => void;
  onProceedToPreview: (generatedQuestions: WorkingQuestion[], config: AiAutoGenerateConfig) => void;
}

export const Interface06AiAutoGenerate: React.FC<Interface06AiAutoGenerateProps> = ({
  existingQuestions,
  onBack,
  onProceedToPreview,
}) => {
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

  // AI Config
  const [questionCount, setQuestionCount] = useState(20);
  const [questionsPerTopic, setQuestionsPerTopic] = useState(10);
  const [features, setFeatures] = useState({
    generalKnowledge: true,
    conceptual: true,
    analytical: false,
    applied: false,
  });
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [allPosts, setAllPosts] = useState<string[]>([]);
  const [addModalType, setAddModalType] = useState<'subject' | 'topic' | 'subtopic' | 'post' | null>(null);

  // Dynamic Prefix State
  const [prefix, setPrefix] = useState('Q-GK-INT-01-');
  const [nextNumber, setNextNumber] = useState(1);
  const [isPrefixCustomized, setIsPrefixCustomized] = useState(false);

  // Example Carousel
  const [exampleIndex, setExampleIndex] = useState(0);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoadingHierarchy(true);
      try {
        const [subs, tops] = await Promise.all([fetchSubjects(), fetchTopics()]);
        if (isMounted) {
          setSubjectsList(subs);
          setTopicsList(tops);

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

  const currentMainTopics = filterTopicsForSubject(topicsList, selectedSubjectId).filter(
    (t) => !t.parent_id || t.parent_id === null
  );

  const currentSubTopics = topicsList.filter(
    (t) => Boolean(selectedMainTopicId) && String(t.parent_id) === String(selectedMainTopicId)
  );

  const currentSubject = subjectsList.find((s) => String(s.id) === String(selectedSubjectId));
  const currentMainTopic = topicsList.find((t) => String(t.id) === String(selectedMainTopicId));
  const currentSubTopic = topicsList.find((t) => String(t.id) === String(selectedSubTopicId));

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

  const handleSubjectChange = (newSubjectId: string) => {
    setSelectedSubjectId(newSubjectId);
    setIsPrefixCustomized(false);

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

  const handleMainTopicChange = (newMainTopicId: string) => {
    setSelectedMainTopicId(newMainTopicId);
    setIsPrefixCustomized(false);

    const subs = topicsList.filter((t) => String(t.parent_id) === String(newMainTopicId));
    setSelectedSubTopicId(subs.length > 0 ? subs[0].id : '');
  };

  const handleSubTopicChange = (newSubTopicId: string) => {
    setSelectedSubTopicId(newSubTopicId);
    setIsPrefixCustomized(false);
  };

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

  const handleGenerate = () => {
    setIsGenerating(true);

    const subjectName = currentSubject?.name || 'আন্তর্জাতিক বিষয়াবলি';
    const topicName = currentMainTopic?.title || 'সাধারণ টপিক';
    const subTopicName = currentSubTopic?.title || '';
    const cleanPost = (post || '').replace(/\s+/g, ' ').trim();

    const config: AiAutoGenerateConfig = {
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
      questionCount,
      questionsPerTopic,
      features,
      additionalInstructions,
      prefix,
      startNumber: nextNumber,
    };

    setTimeout(() => {
      const generated = generateAiQuestions(config);
      setIsGenerating(false);
      onProceedToPreview(generated, config);
    }, 1200);
  };

  const sampleExamples = [
    {
      q: 'জাতিসংঘের বর্তমান মহাসচিব আন্তোনিও গুতেরেস কোন দেশের নাগরিক?',
      opts: ['স্পেন', 'পর্তুগাল', 'ইতালি', 'ব্রাজিল'],
      a: 'পর্তুগাল',
      exp: 'আন্তোনিও গুতেরেস পর্তুগালের সাবেক প্রধানমন্ত্রী ছিলেন এবং ২০১৭ সাল থেকে জাতিসংঘের মহাসচিব হিসেবে দায়িত্ব পালন করছেন।',
    },
    {
      q: 'মাটিবিহীন চাষাবাদ পদ্ধতিকে কী বলা হয়?',
      opts: ['হাইড্রোপনিক্স', 'সেরিকালচার', 'হর্টিকালচার', 'পিসিকালচার'],
      a: 'হাইড্রোপনিক্স',
      exp: 'হাইড্রোপনিক্স হলো পানিতে প্রয়োজনীয় পুষ্টি উপাদান দ্রবীভূত করে মাটি ছাড়া ফসল উৎপাদনের বিজ্ঞানসম্মত কৌশল।',
    },
    {
      q: 'Which treaty ended World War I?',
      opts: ['Treaty of Versailles', 'Treaty of Paris', 'Treaty of Rome', 'Geneva Convention'],
      a: 'Treaty of Versailles',
      exp: 'The Treaty of Versailles was signed on June 28, 1919, formally concluding the First World War.',
    },
  ];

  const currentSample = sampleExamples[exampleIndex % sampleExamples.length];

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
        step1Label="AI জেনারেটর কনফিগ"
        step2Label="প্রিভিউ ও প্রকাশ করুন"
      />

      {/* 3. Basic Information Card: 3-Level Hierarchy */}
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
          বিষয়, মূল টপিক ও সাব-টপিক নির্বাচন করুন
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {/* Subject */}
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

          {/* Main Topic */}
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
                <option value="">কোনো মূল টপিক নেই (নতুন যুক্ত করুন)</option>
              ) : (
                currentMainTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.code})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Sub-Topic */}
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

      {/* 4. Smart Batch Prefix Card */}
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
        onPrefixChange={(newP) => {
          setIsPrefixCustomized(true);
          setPrefix(newP);
        }}
        onNextNumberChange={(newN) => setNextNumber(newN)}
        onRefresh={() => {
          setIsPrefixCustomized(false);
          updatePrefixAndSequence();
        }}
      />

      {/* 5. AI Question Generation Settings & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): AI Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white">AI জেনারেশন সেটিংস</h3>
                <p className="text-[11px] text-slate-400">প্রশ্নের সংখ্যা ও ধরন কনফিগার করুন</p>
              </div>
            </div>

            {/* Question Count Sliders/Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#050914] border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">মোট প্রশ্নের সংখ্যা</label>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    {questionCount} টি
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuestionCount((p) => Math.max(5, p - 5))}
                    className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setQuestionCount((p) => Math.min(100, p + 5))}
                    className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-[#050914] border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">প্রতি টপিকে প্রশ্ন</label>
                  <span className="text-sm font-black text-purple-400 font-mono">
                    {questionsPerTopic} টি
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuestionsPerTopic((p) => Math.max(2, p - 1))}
                    className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="range"
                    min="2"
                    max="25"
                    step="1"
                    value={questionsPerTopic}
                    onChange={(e) => setQuestionsPerTopic(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setQuestionsPerTopic((p) => Math.min(25, p + 1))}
                    className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Feature Checkboxes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">প্রশ্নের ধরন ও ফোকাস</label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { key: 'generalKnowledge', label: 'জ্ঞানমূলক (Knowledge-based)' },
                  { key: 'conceptual', label: 'অনুধাবনমূলক (Conceptual)' },
                  { key: 'analytical', label: 'বিশ্লেষণধর্মী (Analytical)' },
                  { key: 'applied', label: 'প্রয়োগমূলক (Application-based)' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2 p-3 rounded-2xl bg-[#050914] border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={features[item.key as keyof typeof features]}
                      onChange={(e) =>
                        setFeatures({ ...features, [item.key]: e.target.checked })
                      }
                      className="rounded accent-emerald-500 w-4 h-4"
                    />
                    <span className="text-xs text-slate-300">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Instructions */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">অতিরিক্ত নির্দেশনা (ঐচ্ছিক)</label>
              <textarea
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                placeholder="যেমন: সাম্প্রতিক তথ্যসমূহ প্রাধান্য দিন, ব্যাখ্যায় প্রাসঙ্গিক ঐতিহাসিক প্রেক্ষাপট যুক্ত করুন..."
                rows={2}
                className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Action CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 px-6 rounded-3xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-[0.99] disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>AI দিয়ে প্রশ্ন তৈরি হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 stroke-[2.5]" />
                    <span>AI দিয়ে প্রশ্ন তৈরি করুন ({questionCount} টি)</span>
                    <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights & Samples */}
        <div className="space-y-4">
          <div className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-5 shadow-xl space-y-3">
            <h4 className="text-xs font-black text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>AI কীভাবে কাজ করে?</span>
            </h4>

            <div className="space-y-2 text-[11px] text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>আপনার দেওয়া তথ্য বিশ্লেষণ করে প্রাসঙ্গিক প্রশ্ন তৈরি করে</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>সঠিক উত্তর, বিভ্রান্তিকর অপশন ও ব্যাখ্যা সহ তৈরি করে</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>ডুপ্লিকেট চেক করে ইউনিক প্রশ্ন জেনারেট করে</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>সাম্প্রতিক প্রশ্নের ধারা ও স্ট্যান্ডার্ড অনুসরণ করে</span>
              </div>
            </div>
          </div>

          {/* Sample Carousel Card */}
          <div className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-5 shadow-xl space-y-3 relative">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-white">জেনারেটেড প্রশ্নের উদাহরণ</h4>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setExampleIndex((prev) => (prev > 0 ? prev - 1 : sampleExamples.length - 1))}
                  className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setExampleIndex((prev) => prev + 1)}
                  className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-[#050914] border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
              <p className="font-bold text-white leading-relaxed">{currentSample.q}</p>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                {currentSample.opts.map((opt, i) => (
                  <div
                    key={i}
                    className={`px-2 py-1 rounded-lg border ${
                      opt === currentSample.a
                        ? 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300 font-bold'
                        : 'border-slate-800 bg-slate-900/50'
                    }`}
                  >
                    {String.fromCharCode(65 + i)}. {opt}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 border-t border-slate-800 pt-1.5">
                <strong className="text-emerald-400">ব্যাখ্যা:</strong> {currentSample.exp}
              </p>
            </div>

            {/* Dots */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {sampleExamples.map((_, idx) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === exampleIndex % sampleExamples.length
                      ? 'w-4 bg-emerald-400'
                      : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-[#050914] border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-400 flex items-center gap-2">
            <span className="text-base">🔮</span>
            <span>
              <strong>জেনারেশন টিপস:</strong> যত নির্দিষ্ট তথ্য ও টপিক দেবেন, তত ভালো ও নির্ভুল
              প্রশ্ন পাবেন।
            </span>
          </div>
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
