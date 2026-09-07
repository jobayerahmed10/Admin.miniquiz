import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Layers,
  ArrowLeft,
  Check,
  Zap,
  Folder,
  FolderOpen,
  Play,
  Filter,
} from 'lucide-react';
import { Question } from '../../types';
import { DEFAULT_SUBJECTS, DEFAULT_TOPICS, SubjectItem, TopicItem } from '../../lib/subjectTopicManager';
import { sanitizeSubjectName, isSameSubject } from '../../lib/subjectManager';

interface PracticeSectionProps {
  questions: Question[];
  onBackToDashboard?: () => void;
}

interface HierarchicalSubTopic {
  id: string;
  title: string;
  code: string;
  count: number;
  questionIds: Set<string | number>;
}

interface HierarchicalTopic {
  id: string;
  title: string;
  code: string;
  count: number;
  questionIds: Set<string | number>;
  subTopics: HierarchicalSubTopic[];
}

interface HierarchicalSubject {
  id: string;
  name: string;
  code: string;
  count: number;
  questionIds: Set<string | number>;
  topics: HierarchicalTopic[];
}

export const PracticeSection: React.FC<PracticeSectionProps> = ({
  questions,
  onBackToDashboard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  // Active Practice Quiz State
  const [activePracticeTarget, setActivePracticeTarget] = useState<{
    type: 'subject' | 'topic' | 'subtopic';
    title: string;
    questions: Question[];
  } | null>(null);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({});

  // Calculate full hierarchical structure with question counts
  const hierarchyData = useMemo(() => {
    // 1. Deduplicate incoming questions by normalized question text & filter Usul/Fiqh/dummy questions
    const deduplicatedQuestions: Question[] = [];
    const seenNormTexts = new Set<string>();

    questions.forEach((q) => {
      const qIdStr = String(q.id || '');
      const cleanSub = (q.subject || '').trim();
      const cleanTop = (q.topic || '').trim();
      const cleanSubTop = (q.sub_topic || q.subtopic || '').trim();
      const qText = (q.question || '').toLowerCase();
      const normText = (q.question || '').trim().toLowerCase().replace(/\s+/g, ' ');

      const isUsulOrFiqh =
        cleanSub.includes('উসূল') ||
        cleanSub.includes('ফিকহ') ||
        cleanSub.includes('আরবি') ||
        cleanSub.includes('ইসলাম') ||
        cleanTop.includes('উসূল') ||
        cleanTop.includes('ফিকহ') ||
        cleanSubTop.includes('উসূল') ||
        cleanSubTop.includes('ফিকহ') ||
        qText.includes('উসূল') ||
        qText.includes('ফিকহ') ||
        qText.includes('কিতাবুল্লাহ') ||
        qText.includes('শরীয়ত');

      const isDummyDemo =
        qIdStr.startsWith('Q-GK-') ||
        qIdStr.startsWith('Q-MATH-') ||
        qIdStr.startsWith('Q-MOCK-') ||
        qText.includes('সাধারণ জ্ঞান টেস্ট প্রশ্ন') ||
        qText.includes('গণিত টেস্ট প্রশ্ন') ||
        qText.includes('বিসিএস পূর্ণাঙ্গ মক প্রশ্ন') ||
        qText.includes('বাংলাদেশের জাতীয় ফুল কোনটি') ||
        qText.includes('ভাষা আন্দোলনের শহীদ বরকত');

      if (isUsulOrFiqh || isDummyDemo || !normText || seenNormTexts.has(normText)) {
        return;
      }
      seenNormTexts.add(normText);
      deduplicatedQuestions.push(q);
    });

    // Group deduplicated questions by subject
    const subjectMap = new Map<string, Question[]>();
    deduplicatedQuestions.forEach((q) => {
      const sanitized = sanitizeSubjectName(q.subject);
      if (!subjectMap.has(sanitized)) {
        subjectMap.set(sanitized, []);
      }
      subjectMap.get(sanitized)!.push(q);
    });

    const result: HierarchicalSubject[] = [];
    const processedSubjectNames = new Set<string>();

    DEFAULT_SUBJECTS.forEach((sub) => {
      const subName = sanitizeSubjectName(sub.name);
      processedSubjectNames.add(subName);
      const subQuestions = subjectMap.get(subName) || [];

      // Get Main Topics for this subject
      const mainTopicsDef = DEFAULT_TOPICS.filter(
        (t) => t.subject_id === sub.id && !t.parent_id
      );

      const topicList: HierarchicalTopic[] = [];
      const matchedSubjectQIds = new Set<string | number>();
      const assignedQIdsInSubject = new Set<string | number>();

      mainTopicsDef.forEach((topDef) => {
        const topTitleLower = topDef.title.trim().toLowerCase();
        const topCodeLower = topDef.code.trim().toLowerCase();

        // Get Sub-Topics for this main topic
        const subTopicsDef = DEFAULT_TOPICS.filter(
          (t) => t.parent_id === topDef.id
        );

        const subTopicList: HierarchicalSubTopic[] = [];
        const topQuestionIds = new Set<string | number>();

        subTopicsDef.forEach((subTopDef) => {
          const stTitleLower = subTopDef.title.trim().toLowerCase();
          const stCodeLower = subTopDef.code.trim().toLowerCase();

          const stQuestionIds = new Set<string | number>();

          subQuestions.forEach((q) => {
            const qTopic = (q.topic || '').trim().toLowerCase();
            const qSubTopic = (q.sub_topic || q.subtopic || '').trim().toLowerCase();
            const qTopId = String(q.topic_id || '').toLowerCase();
            const qSubTopId = String(q.sub_topic_id || '').toLowerCase();

            const isSubTopMatch =
              (qSubTopId && qSubTopId === subTopDef.id.toLowerCase()) ||
              qSubTopic === stTitleLower ||
              qTopic === stTitleLower ||
              (stTitleLower.length > 3 && (qSubTopic.includes(stTitleLower) || stTitleLower.includes(qSubTopic))) ||
              (stTitleLower.length > 3 && (qTopic.includes(stTitleLower) || stTitleLower.includes(qTopic))) ||
              (q.question_code && q.question_code.toLowerCase().includes(stCodeLower)) ||
              (q.code && q.code.toLowerCase().includes(stCodeLower));

            if (isSubTopMatch) {
              stQuestionIds.add(q.id);
              topQuestionIds.add(q.id);
              matchedSubjectQIds.add(q.id);
              assignedQIdsInSubject.add(q.id);
            }
          });

          subTopicList.push({
            id: subTopDef.id,
            title: subTopDef.title,
            code: subTopDef.code,
            count: stQuestionIds.size,
            questionIds: stQuestionIds,
          });
        });

        // Also check questions that match main topic directly
        subQuestions.forEach((q) => {
          const qTopic = (q.topic || '').trim().toLowerCase();
          const qSubTopic = (q.sub_topic || q.subtopic || '').trim().toLowerCase();
          const qTopId = String(q.topic_id || '').toLowerCase();

          const isTopMatch =
            (qTopId && qTopId === topDef.id.toLowerCase()) ||
            qTopic === topTitleLower ||
            qSubTopic === topTitleLower ||
            (topTitleLower.length > 3 && (qTopic.includes(topTitleLower) || topTitleLower.includes(qTopic))) ||
            (topTitleLower.length > 3 && (qSubTopic.includes(topTitleLower) || topTitleLower.includes(qSubTopic))) ||
            (q.question_code && q.question_code.toLowerCase().includes(topCodeLower)) ||
            (q.code && q.code.toLowerCase().includes(topCodeLower));

          if (isTopMatch) {
            topQuestionIds.add(q.id);
            matchedSubjectQIds.add(q.id);
            assignedQIdsInSubject.add(q.id);
          }
        });

        topicList.push({
          id: topDef.id,
          title: topDef.title,
          code: topDef.code,
          count: topQuestionIds.size,
          questionIds: topQuestionIds,
          subTopics: subTopicList,
        });
      });

      // Catch any unassigned questions in this subject
      const unassignedInSub = subQuestions.filter((q) => !assignedQIdsInSubject.has(q.id));
      if (unassignedInSub.length > 0) {
        // Group unassigned questions by their topic
        const unassignedByTopic = new Map<string, Question[]>();
        unassignedInSub.forEach((q) => {
          const tName = (q.topic || q.sub_topic || 'সাধারণ ও প্র্যাকটিস প্রশ্ন').trim();
          if (!unassignedByTopic.has(tName)) {
            unassignedByTopic.set(tName, []);
          }
          unassignedByTopic.get(tName)!.push(q);
        });

        unassignedByTopic.forEach((qList, tName) => {
          const qIdsSet = new Set(qList.map((q) => q.id));
          qList.forEach((q) => matchedSubjectQIds.add(q.id));

          // Check if there's an existing topic in topicList with similar name
          const existingTop = topicList.find(
            (t) => t.title.toLowerCase().trim() === tName.toLowerCase() || t.title.toLowerCase().includes(tName.toLowerCase())
          );

          if (existingTop) {
            qList.forEach((q) => existingTop.questionIds.add(q.id));
            existingTop.count = existingTop.questionIds.size;
          } else {
            // Create a new topic entry
            topicList.push({
              id: `dynamic_top_${sub.id}_${Math.random().toString(36).substring(2, 7)}`,
              title: tName,
              code: `${sub.code}-GEN`,
              count: qIdsSet.size,
              questionIds: qIdsSet,
              subTopics: [
                {
                  id: `dynamic_subtop_${sub.id}_${Math.random().toString(36).substring(2, 7)}`,
                  title: tName,
                  code: `${sub.code}-GEN-01`,
                  count: qIdsSet.size,
                  questionIds: qIdsSet,
                },
              ],
            });
          }
        });
      }

      // Ensure all subQuestions are in matchedSubjectQIds
      subQuestions.forEach((q) => matchedSubjectQIds.add(q.id));

      result.push({
        id: sub.id,
        name: sub.name,
        code: sub.code,
        count: subQuestions.length,
        questionIds: matchedSubjectQIds,
        topics: topicList,
      });
    });

    // Process custom subjects in subjectMap not in DEFAULT_SUBJECTS
    subjectMap.forEach((subQuestions, sName) => {
      if (!processedSubjectNames.has(sName) && subQuestions.length > 0) {
        const matchedSubjectQIds = new Set(subQuestions.map((q) => q.id));
        const dynamicTopicsMap = new Map<string, Question[]>();

        subQuestions.forEach((q) => {
          const tName = (q.topic || 'সাধারণ প্রশ্ন').trim();
          if (!dynamicTopicsMap.has(tName)) {
            dynamicTopicsMap.set(tName, []);
          }
          dynamicTopicsMap.get(tName)!.push(q);
        });

        const topicList: HierarchicalTopic[] = [];
        dynamicTopicsMap.forEach((qList, tName) => {
          const qIdsSet = new Set(qList.map((q) => q.id));
          topicList.push({
            id: `dyn_top_${sName}_${Math.random().toString(36).substring(2, 7)}`,
            title: tName,
            code: 'CUSTOM',
            count: qIdsSet.size,
            questionIds: qIdsSet,
            subTopics: [
              {
                id: `dyn_subtop_${sName}_${Math.random().toString(36).substring(2, 7)}`,
                title: tName,
                code: 'CUSTOM-01',
                count: qIdsSet.size,
                questionIds: qIdsSet,
              },
            ],
          });
        });

        result.push({
          id: `dyn_sub_${sName}`,
          name: sName,
          code: 'CUSTOM',
          count: subQuestions.length,
          questionIds: matchedSubjectQIds,
          topics: topicList,
        });
      }
    });

    return result;
  }, [questions]);

  // Filter hierarchy by search query if typed
  const filteredHierarchy = useMemo(() => {
    if (!searchQuery.trim()) return hierarchyData;
    const q = searchQuery.toLowerCase().trim();

    return hierarchyData
      .map((sub) => {
        const subNameMatch = sub.name.toLowerCase().includes(q);

        const filteredTopics = sub.topics
          .map((top) => {
            const topMatch = top.title.toLowerCase().includes(q);
            const filteredSubTopics = top.subTopics.filter((st) =>
              st.title.toLowerCase().includes(q)
            );

            if (topMatch || filteredSubTopics.length > 0) {
              return {
                ...top,
                subTopics: topMatch ? top.subTopics : filteredSubTopics,
              };
            }
            return null;
          })
          .filter(Boolean) as HierarchicalTopic[];

        if (subNameMatch || filteredTopics.length > 0) {
          return {
            ...sub,
            topics: filteredTopics.length > 0 ? filteredTopics : sub.topics,
          };
        }
        return null;
      })
      .filter(Boolean) as HierarchicalSubject[];
  }, [hierarchyData, searchQuery]);

  // Toggle expand for subject / topic
  const toggleSubject = (id: string) => {
    setExpandedSubjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTopic = (id: string) => {
    setExpandedTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const subs: Record<string, boolean> = {};
    const tops: Record<string, boolean> = {};
    hierarchyData.forEach((sub) => {
      subs[sub.id] = true;
      sub.topics.forEach((top) => {
        tops[top.id] = true;
      });
    });
    setExpandedSubjects(subs);
    setExpandedTopics(tops);
  };

  const collapseAll = () => {
    setExpandedSubjects({});
    setExpandedTopics({});
  };

  // Launch Practice Mode
  const startPractice = (
    type: 'subject' | 'topic' | 'subtopic',
    title: string,
    qIds: Set<string | number>
  ) => {
    let practiceQs = questions.filter((q) => qIds && qIds.has(q.id));
    if (practiceQs.length === 0) {
      const cleanTitle = title.trim().toLowerCase();
      // Fallback: match by title string if Set was empty
      practiceQs = questions.filter((q) => {
        const qSub = (q.subject || '').trim().toLowerCase();
        const qTop = (q.topic || '').trim().toLowerCase();
        const qSubTop = (q.sub_topic || q.subtopic || '').trim().toLowerCase();

        if (type === 'subject') {
          return (
            isSameSubject(q.subject, title) ||
            sanitizeSubjectName(q.subject) === sanitizeSubjectName(title) ||
            qSub.includes(cleanTitle) ||
            cleanTitle.includes(qSub)
          );
        }
        if (type === 'topic') {
          return (
            qTop === cleanTitle ||
            qSubTop === cleanTitle ||
            (cleanTitle.length > 3 && (qTop.includes(cleanTitle) || cleanTitle.includes(qTop))) ||
            (cleanTitle.length > 3 && (qSubTop.includes(cleanTitle) || cleanTitle.includes(qSubTop)))
          );
        }
        if (type === 'subtopic') {
          return (
            qSubTop === cleanTitle ||
            qTop === cleanTitle ||
            (cleanTitle.length > 3 && (qSubTop.includes(cleanTitle) || cleanTitle.includes(qSubTop))) ||
            (cleanTitle.length > 3 && (qTop.includes(cleanTitle) || cleanTitle.includes(qTop)))
          );
        }
        return false;
      });
    }

    if (practiceQs.length === 0) {
      alert(`'${title}' টপিকে প্র্যাকটিসের জন্য কোনো প্রকাশিত প্রশ্ন পাওয়া যায়নি।`);
      return;
    }

    setActivePracticeTarget({
      type,
      title,
      questions: practiceQs,
    });
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setShowExplanations({});
  };

  // Answer selection handler in practice mode
  const handleSelectOption = (qIdx: number, optionKey: string) => {
    if (selectedAnswers[qIdx]) return; // locked once answered
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optionKey }));
    setShowExplanations((prev) => ({ ...prev, [qIdx]: true }));
  };

  const toggleExplanation = (qIdx: number) => {
    setShowExplanations((prev) => ({ ...prev, [qIdx]: !prev[qIdx] }));
  };

  // Stats calculation in active practice
  const practiceStats = useMemo(() => {
    if (!activePracticeTarget) return { total: 0, answered: 0, correct: 0, wrong: 0 };
    const total = activePracticeTarget.questions.length;
    let correct = 0;
    let wrong = 0;

    Object.entries(selectedAnswers).forEach(([qIdxStr, chosenKey]) => {
      const idx = Number(qIdxStr);
      const q = activePracticeTarget.questions[idx];
      if (q) {
        let correctKey = (q.correct_answer || '').toLowerCase();
        if (correctKey.startsWith('option_')) {
          correctKey = correctKey.replace('option_', '');
        }

        const normChosen = String(chosenKey || '').toLowerCase().replace('option_', '');

        if (normChosen === correctKey) {
          correct++;
        } else {
          wrong++;
        }
      }
    });

    return {
      total,
      answered: Object.keys(selectedAnswers).length,
      correct,
      wrong,
    };
  }, [activePracticeTarget, selectedAnswers]);

  // ACTIVE PRACTICE QUIZ SCREEN
  if (activePracticeTarget) {
    const qList = activePracticeTarget.questions;
    const currentQ = qList[currentQIndex];

    const getNormalizedCorrect = (q: Question) => {
      let ca = (q.correct_answer || '').toLowerCase();
      if (ca.startsWith('option_')) ca = ca.replace('option_', '');
      return ca;
    };

    const targetCorrectKey = currentQ ? getNormalizedCorrect(currentQ) : '';
    const userChosenKey = selectedAnswers[currentQIndex] || null;

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200 pb-12">
        {/* Practice Session Top Header */}
        <div className="bg-[#0c1021] border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActivePracticeTarget(null)}
                className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="তালিকায় ফিরে যান"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  প্র্যাকটিস মোড
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                  {activePracticeTarget.title}
                </h2>
              </div>
            </div>

            {/* Score Tracker */}
            <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2 text-xs font-bold">
              <span className="text-slate-400">
                প্রশ্ন: <span className="text-white font-mono">{currentQIndex + 1}/{practiceStats.total}</span>
              </span>
              <span className="text-slate-700">|</span>
              <span className="text-emerald-400">
                সঠিক: <span className="font-mono">{practiceStats.correct}</span>
              </span>
              <span className="text-slate-700">|</span>
              <span className="text-rose-400">
                ভুল: <span className="font-mono">{practiceStats.wrong}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Question Card */}
        {currentQ && (
          <div className="bg-[#0e1428] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Question Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                  {currentQIndex + 1}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                  {currentQ.question}
                </h3>
              </div>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                { key: 'a', label: 'ক', text: currentQ.option_a },
                { key: 'b', label: 'খ', text: currentQ.option_b },
                { key: 'c', label: 'গ', text: currentQ.option_c },
                { key: 'd', label: 'ঘ', text: currentQ.option_d },
              ].map((opt) => {
                const isSelected = userChosenKey === opt.key;
                const isCorrect = targetCorrectKey === opt.key;
                const hasAnswered = Boolean(userChosenKey);

                let btnClass =
                  'bg-slate-900/60 hover:bg-slate-800/90 border-slate-800 text-slate-200 hover:border-slate-700';

                if (hasAnswered) {
                  if (isCorrect) {
                    btnClass =
                      'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold ring-1 ring-emerald-500/40';
                  } else if (isSelected && !isCorrect) {
                    btnClass =
                      'bg-rose-500/20 border-rose-500/60 text-rose-300 font-bold ring-1 ring-rose-500/40';
                  } else {
                    btnClass = 'bg-slate-900/30 border-slate-800/50 text-slate-500 opacity-60';
                  }
                }

                return (
                  <button
                    key={opt.key}
                    disabled={hasAnswered}
                    onClick={() => handleSelectOption(currentQIndex, opt.key)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3 relative overflow-hidden group ${btnClass}`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        hasAnswered && isCorrect
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : hasAnswered && isSelected && !isCorrect
                          ? 'bg-rose-500 text-white font-black'
                          : 'bg-slate-800 text-slate-400 group-hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span className="text-sm font-medium leading-relaxed flex-1 pt-0.5">
                      {opt.text}
                    </span>

                    {hasAnswered && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />
                    )}
                    {hasAnswered && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation Box */}
            {currentQ.explanation && (
              <div className="pt-2">
                <button
                  onClick={() => toggleExplanation(currentQIndex)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl px-3.5 py-2 transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  {showExplanations[currentQIndex] ? 'ব্যাখ্যা লুকান' : 'ব্যাখ্যা দেখুন'}
                </button>

                {showExplanations[currentQIndex] && (
                  <div className="mt-3 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-4 text-xs sm:text-sm text-indigo-200 leading-relaxed animate-in fade-in duration-200">
                    <span className="font-bold text-indigo-300 block mb-1">💡 ব্যাখ্যা:</span>
                    {currentQ.explanation}
                  </div>
                )}
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
              <button
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-200 transition-colors"
              >
                পূর্ববর্তী প্রশ্ন
              </button>

              <button
                onClick={() => {
                  setSelectedAnswers({});
                  setShowExplanations({});
                  setCurrentQIndex(0);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                title="পুনরায় শুরু করুন"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                রিসেট
              </button>

              <button
                disabled={currentQIndex === qList.length - 1}
                onClick={() => setCurrentQIndex((prev) => Math.min(qList.length - 1, prev + 1))}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-950 transition-colors shadow-lg shadow-emerald-500/20"
              >
                পরবর্তী প্রশ্ন
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // MAIN HIERARCHICAL TREE VIEW (SUBJECT -> TOPIC -> SUBTOPIC)
  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-[#0c1329] via-[#0e1a38] to-[#09152b] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold inline-flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                প্র্যাকটিস হায়ারার্কি
              </span>
              <span className="text-xs text-slate-400">
                মোট বিষয়: {hierarchyData.length} টি
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              বিষয়, টপিক ও সাব-টপিক প্র্যাকটিস
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              প্রশ্ন ব্যাংকের অন্তর্ভুক্ত বিষয়, মূল টপিক এবং সাব-টপিক ব্রাউজ করুন এবং প্রতিটি টপিকে কয়টি প্রশ্ন আছে তা দেখে প্র্যাকটিস শুরু করুন।
            </p>
          </div>

          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="self-start md:self-auto px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors inline-flex items-center gap-2 border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              ড্যাশবোর্ডে ফিরুন
            </button>
          )}
        </div>
      </div>

      {/* Toolbar: Search + Expand/Collapse Controls */}
      <div className="bg-[#0b1021] border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="বিষয় বা টপিক খুঁজুন..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Expand / Collapse buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            সব খুলুন
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            সব বন্ধ করুন
          </button>
        </div>
      </div>

      {/* Main Hierarchy Tree Accordion List */}
      <div className="space-y-4">
        {filteredHierarchy.map((subject) => {
          const isSubExpanded = Boolean(expandedSubjects[subject.id]);

          return (
            <div
              key={subject.id}
              className="bg-[#0c1024] border border-slate-800/90 hover:border-slate-700/80 rounded-3xl overflow-hidden shadow-xl transition-all duration-200"
            >
              {/* Level 1: Subject Header (বিষয়) */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-4 bg-gradient-to-r from-[#0c1024] to-[#0e1633]">
                <div
                  onClick={() => toggleSubject(subject.id)}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 select-none group"
                >
                  <button className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {isSubExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* NO subject code displayed as requested */}
                      <h2 className="text-base sm:text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                        {subject.name}
                      </h2>
                      {/* Question Count Badge */}
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                        {subject.count} টি প্রশ্ন
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      মোট টপিক: {subject.topics.length} টি
                    </p>
                  </div>
                </div>

                {/* Practice Subject Action Button */}
                <button
                  onClick={() => startPractice('subject', subject.name, subject.questionIds)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shrink-0 inline-flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  প্র্যাকটিস
                </button>
              </div>

              {/* Level 2: Topics List (টপিক) */}
              {isSubExpanded && (
                <div className="border-t border-slate-800/80 bg-[#090d1f] p-4 sm:p-6 space-y-3">
                  {subject.topics.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-2">
                      এই বিষয়ে এখনো কোনো নির্দিষ্ট টপিক যুক্ত হয়নি।
                    </p>
                  ) : (
                    subject.topics.map((topic) => {
                      const isTopExpanded = Boolean(expandedTopics[topic.id]);

                      return (
                        <div
                          key={topic.id}
                          className="bg-[#0e142b] border border-slate-800/80 rounded-2xl overflow-hidden transition-colors"
                        >
                          {/* Main Topic Row */}
                          <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 bg-slate-900/40">
                            <div
                              onClick={() => toggleTopic(topic.id)}
                              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 select-none group"
                            >
                              <button className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                                {isTopExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>

                              <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                                <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                                {/* NO topic code displayed as requested */}
                                <h3 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                                  {topic.title}
                                </h3>
                                {/* Question Count Badge */}
                                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-semibold">
                                  {topic.count} টি প্রশ্ন
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => startPractice('topic', topic.title, topic.questionIds)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white font-bold text-[11px] transition-colors shrink-0 inline-flex items-center gap-1"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              প্র্যাকটিস
                            </button>
                          </div>

                          {/* Level 3: Sub-Topics List (সাব-টপিক) */}
                          {isTopExpanded && (
                            <div className="p-3 bg-[#080b18] border-t border-slate-800/60 space-y-2">
                              {topic.subTopics.length === 0 ? (
                                <p className="text-[11px] text-slate-500 italic px-3 py-1">
                                  কোনো আলাদা সাব-টপিক নিবন্ধিত নেই।
                                </p>
                              ) : (
                                topic.subTopics.map((subTopic) => (
                                  <div
                                    key={subTopic.id}
                                    className="p-2.5 sm:p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/60 flex items-center justify-between gap-3 transition-colors ml-4 sm:ml-6"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                                      {/* NO subtopic code displayed as requested */}
                                      <span className="text-xs font-semibold text-slate-200 truncate">
                                        {subTopic.title}
                                      </span>
                                      {/* Question Count Badge */}
                                      <span className="px-2 py-0.5 rounded-full bg-slate-800/80 text-emerald-400 text-[10px] font-bold border border-slate-700/60 shrink-0">
                                        {subTopic.count} টি প্রশ্ন
                                      </span>
                                    </div>

                                    <button
                                      onClick={() =>
                                        startPractice('subtopic', subTopic.title, subTopic.questionIds)
                                      }
                                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500 text-slate-300 hover:text-slate-950 font-bold text-[10px] transition-colors shrink-0 inline-flex items-center gap-1"
                                    >
                                      <Play className="w-2.5 h-2.5 fill-current" />
                                      প্র্যাকটিস
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
