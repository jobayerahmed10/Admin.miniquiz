import React, { useState, useEffect, useCallback } from 'react';
import {
  Info,
  Plus,
  Trash2,
  ArrowRight,
  Sparkles,
  Layers,
  FolderTree,
} from 'lucide-react';
import { WorkingQuestion } from '../../types/questionBank';
import { QuestionBankHeader } from './Header';
import { StepIndicator } from './StepIndicator';
import { SmartBatchPrefixCard } from './SmartBatchPrefixCard';
import { AddCategoryModal, AddCategoryPayload } from './AddCategoryModal';
import {
  getQuestionBankDirectionality,
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
  addSubTopic,
  suggestSubjectCode,
  suggestMainTopicCode,
  suggestSubTopicCode,
  constructSmartBatchPrefix,
  computeNextSequenceForPrefix,
} from '../../lib/subjectTopicManager';

interface Interface02ManualEntryProps {
  existingQuestions: Question[];
  onBack: () => void;
  onProceedToPreview: (questions: WorkingQuestion[], meta: any) => void;
  initialQuestions?: WorkingQuestion[];
}

export const Interface02ManualEntry: React.FC<Interface02ManualEntryProps> = ({
  existingQuestions,
  onBack,
  onProceedToPreview,
  initialQuestions,
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

  const [allPosts, setAllPosts] = useState<string[]>([]);
  const [addModalType, setAddModalType] = useState<'subject' | 'topic' | 'subtopic' | 'post' | null>(null);

  // Dynamic Prefix State
  const [prefix, setPrefix] = useState('Q-GK-INT-01-');
  const [nextNumber, setNextNumber] = useState(1);
  const [isPrefixCustomized, setIsPrefixCustomized] = useState(false);

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

  // Dynamic prefix update
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

  // Working questions state
  const [questionsList, setQuestionsList] = useState<WorkingQuestion[]>(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      return initialQuestions;
    }
    return [
      {
        tempId: `manual_${Date.now()}_0`,
        question: 'What is the noun form of the word "beautiful"?',
        options: {
          A: 'Beautify',
          B: 'Beauty',
          C: 'Beautifully',
          D: 'Beauteous',
        },
        correctAnswer: 'B',
        explanation: 'The noun form of "beautiful" (adjective) is "beauty".',
        reference: 'Parts of Speech (ENG-GRM-06)',
        subject: 'English Grammar',
        topic: 'Parts of Speech',
        sub_topic: 'Noun and Noun Related',
        post: 'বিসিএস ক্যাডার (BCS)',
        language: 'English',
        questionType: 'MCQ (একটি সঠিক উত্তর)',
        difficulty: 'মাঝারি',
        status: 'published',
      },
    ];
  });

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
        // Save to sub_topics table
        addSubTopic(selectedMainTopicId, title, code, selectedSubjectId);
        // Also save to topics table
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

  const handleAddQuestionCard = () => {
    const newQ: WorkingQuestion = {
      tempId: `manual_${Date.now()}_${questionsList.length}`,
      question: '',
      options: { A: '', B: '', C: '', D: '' },
      correctAnswer: 'A',
      explanation: '',
      reference: '',
      subject: currentSubject?.name || 'আন্তর্জাতিক বিষয়াবলি',
      topic: currentMainTopic?.title || 'সাধারণ টপিক',
      sub_topic: currentSubTopic?.title || '',
      subject_id: selectedSubjectId,
      topic_id: selectedMainTopicId,
      sub_topic_id: selectedSubTopicId,
      post,
      language,
      questionType,
      difficulty,
      status: 'published',
    };
    setQuestionsList([...questionsList, newQ]);
  };

  const handleDeleteQuestionCard = (index: number) => {
    if (questionsList.length <= 1) return;
    setQuestionsList(questionsList.filter((_, idx) => idx !== index));
  };

  const handleQuestionChange = (
    index: number,
    field: keyof WorkingQuestion | 'optA' | 'optB' | 'optC' | 'optD',
    value: any
  ) => {
    setQuestionsList((prev) =>
      prev.map((q, idx) => {
        if (idx !== index) return q;

        if (field === 'optA') {
          return { ...q, options: { ...q.options, A: value } };
        }
        if (field === 'optB') {
          return { ...q, options: { ...q.options, B: value } };
        }
        if (field === 'optC') {
          return { ...q, options: { ...q.options, C: value } };
        }
        if (field === 'optD') {
          return { ...q, options: { ...q.options, D: value } };
        }

        return { ...q, [field]: value };
      })
    );
  };

  const handleNext = () => {
    const subjectName = currentSubject?.name || 'আন্তর্জাতিক বিষয়াবলি';
    const topicName = currentMainTopic?.title || 'সাধারণ টপিক';
    const subTopicName = currentSubTopic?.title || '';

    const validated = questionsList.map((q) => {
      const dirInfo = getQuestionBankDirectionality({
        question: q.question,
        options: q.options,
        explanation: q.explanation,
        language: q.language || language,
      });

      return {
        ...q,
        subject: subjectName,
        topic: topicName,
        sub_topic: subTopicName,
        subject_id: selectedSubjectId,
        topic_id: selectedMainTopicId,
        sub_topic_id: selectedSubTopicId,
        post,
        language,
        questionType,
        difficulty,
        isArabic: dirInfo.isQuestionArabic,
        questionDir: dirInfo.questionDir,
        optionsDir: dirInfo.optionsDir,
        explanationDir: dirInfo.explanationDir,
      };
    });

    onProceedToPreview(validated, {
      subject: subjectName,
      topic: topicName,
      sub_topic: subTopicName,
      subject_id: selectedSubjectId,
      topic_id: selectedMainTopicId,
      sub_topic_id: selectedSubTopicId,
      subject_code: currentSubject?.code,
      topic_code: currentMainTopic?.code,
      sub_topic_code: currentSubTopic?.code,
      post,
      language,
      questionType,
      difficulty,
      prefix,
      nextNumber,
    });
  };

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
        step1Label="প্রশ্ন যোগ করুন"
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
          প্রশ্নের বিষয়, মূল টপিক ও সাব-টপিক নির্বাচন করুন
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

      {/* 5. Question Creation Cards */}
      <div className="space-y-5">
        {questionsList.map((q, qIndex) => {
          const dirInfo = getQuestionBankDirectionality({
            question: q.question,
            options: q.options,
            explanation: q.explanation,
            language: q.language || language,
          });

          const isArabic = dirInfo.isQuestionArabic;
          const qDir = dirInfo.questionDir;
          const optDir = dirInfo.optionsDir;
          const expDir = dirInfo.explanationDir;

          const arabicOptionLabels: Record<string, string> = {
            A: 'أ',
            B: 'ب',
            C: 'ج',
            D: 'د',
          };

          return (
            <div
              key={q.tempId}
              className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 relative overflow-hidden"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
                    {qIndex + 1}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-white">
                    প্রশ্ন #{qIndex + 1} বিবরণ
                  </h3>
                  {isArabic && (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      عربي (RTL)
                    </span>
                  )}
                </div>

                {questionsList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestionCard(qIndex)}
                    className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors"
                    title="এই প্রশ্নটি মুছুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Question Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">প্রশ্ন লিখুন *</label>
                <textarea
                  value={q.question}
                  onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                  placeholder="যেমন: বাংলাদেশের প্রথম রাষ্ট্রপতি কে ছিলেন?"
                  rows={2}
                  dir={qDir}
                  className={`w-full bg-[#050914] border border-slate-700/80 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed ${
                    qDir === 'rtl' ? 'font-amiri text-base leading-relaxed text-right' : 'text-left'
                  }`}
                  required
                />
              </div>

              {/* Options A, B, C, D */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">বিকল্পসমূহ *</label>
                  <span className="text-[10px] text-slate-400">
                    {optDir === 'rtl' ? 'বিন্যাস: RTL' : 'বিন্যাস: LTR'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" dir={optDir}>
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                    const optKey = `opt${opt}` as 'optA' | 'optB' | 'optC' | 'optD';
                    const optLabel = optDir === 'rtl' ? arabicOptionLabels[opt] || opt : opt;

                    return (
                      <div key={opt} className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400">
                          বিকল্প {optLabel} *
                        </label>
                        <input
                          type="text"
                          value={q.options[opt]}
                          onChange={(e) => handleQuestionChange(qIndex, optKey, e.target.value)}
                          placeholder={`বিকল্প ${optLabel}`}
                          dir={optDir}
                          className={`w-full bg-[#050914] border border-slate-700/80 rounded-2xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors ${
                            optDir === 'rtl' ? 'font-amiri text-sm text-right' : 'text-left'
                          }`}
                          required
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Correct Answer Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">সঠিক উত্তর নির্বাচন করুন *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                    const isSelected = q.correctAnswer === opt;
                    const optLabel = optDir === 'rtl' ? arabicOptionLabels[opt] || opt : opt;

                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleQuestionChange(qIndex, 'correctAnswer', opt)}
                        className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black'
                            : 'bg-[#050914] border-slate-700/80 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <span>বিকল্প {optLabel}</span>
                        {isSelected && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explanation (Optional) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">ব্যাখ্যা (ঐচ্ছিক)</label>
                <textarea
                  value={q.explanation || ''}
                  onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                  placeholder="প্রশ্নের ব্যাখ্যা বা সমাধান লিখুন..."
                  rows={2}
                  dir={expDir}
                  className={`w-full bg-[#050914] border border-slate-700/80 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors ${
                    expDir === 'rtl' ? 'font-amiri text-sm leading-relaxed text-right' : 'text-left'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. Add Another Question Button & Big Next CTA */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={handleAddQuestionCard}
          className="w-full py-3 px-4 rounded-2xl bg-[#0b1322] hover:bg-[#121c2d] border border-dashed border-slate-700 hover:border-emerald-500/60 text-slate-300 hover:text-emerald-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ আরো একটি প্রশ্ন যুক্ত করুন</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="w-full py-4 px-6 rounded-3xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-[0.99]"
        >
          <span>পরবর্তী (প্রিভিউ দেখুন)</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div className="text-center text-[11px] text-slate-400">
          মোট প্রশ্ন: <strong className="text-emerald-400">{questionsList.length} টি</strong> | ✓
          সঠিক উত্তর সেট | ✏️ ব্যাখ্যা সহ
        </div>
      </div>

      {/* Add Custom Subject/Topic/SubTopic/Post Modal */}
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
