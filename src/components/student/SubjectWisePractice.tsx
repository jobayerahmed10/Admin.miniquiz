import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  BookOpen,
  Play,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Award,
  RotateCcw,
  Check,
  Flame,
  Info,
} from 'lucide-react';
import { SubjectPost, SyllabusTopic, Question, StudentUser } from '../../types';
import { fetchSubjectPosts } from '../../lib/subjectPostManager';
import { fetchAllQuestions } from '../../lib/supabase';
import { isPostMatch } from '../../lib/postManager';
import { saveStudentExamAttempt, getStudentDashboardGrowthData } from '../../lib/studentAuth';

interface SubjectWisePracticeProps {
  student: StudentUser | null;
  onRefreshGrowth?: () => void;
}

export const SubjectWisePractice: React.FC<SubjectWisePracticeProps> = ({
  student,
  onRefreshGrowth,
}) => {
  const [posts, setPosts] = useState<SubjectPost[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string>('');

  // Active Practice State
  const [activeTopic, setActiveTopic] = useState<SyllabusTopic | null>(null);
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string | number, string>>({});
  const [showExplanation, setShowExplanation] = useState<Record<string | number, boolean>>({});
  const [practiceFinished, setPracticeFinished] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [postsRes, qRes] = await Promise.all([
        fetchSubjectPosts(),
        fetchAllQuestions(),
      ]);

      const activeList = postsRes.posts.filter((p) => p.status === 'active');
      setPosts(activeList);
      if (activeList.length > 0 && !selectedPostId) {
        setSelectedPostId(activeList[0].id);
      }

      setQuestions(qRes.questions || []);
    } catch (err) {
      console.error('Error loading subject wise practice data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentPost = useMemo(() => {
    return posts.find((p) => p.id === selectedPostId) || posts[0];
  }, [posts, selectedPostId]);

  // Calculate question counts per topic
  const getQuestionCountForTopic = (postName: string, topicName: string) => {
    return questions.filter((q) => {
      const topicMatches =
        q.topic?.toLowerCase().trim() === topicName.toLowerCase().trim();
      const postMatches = isPostMatch(q.post, postName) || q.subject?.includes(postName);
      return topicMatches || (postMatches && q.topic?.toLowerCase().includes(topicName.toLowerCase()));
    }).length;
  };

  // Start Practice for a topic
  const handleStartTopicPractice = (topic: SyllabusTopic) => {
    if (!currentPost) return;

    setActiveTopic(topic);
    
    // Filter questions matching this topic and post
    let matched = questions.filter((q) => {
      const topicMatches =
        q.topic?.toLowerCase().trim() === topic.name.toLowerCase().trim() ||
        q.topic?.toLowerCase().includes(topic.name.toLowerCase());
      const postMatches = isPostMatch(q.post, currentPost.name) || q.subject?.includes(currentPost.name);
      return topicMatches && (postMatches || !q.post);
    });

    // If specific filter has low questions, include broader topic match
    if (matched.length === 0) {
      matched = questions.filter(
        (q) =>
          q.topic?.toLowerCase().includes(topic.name.toLowerCase()) ||
          q.subject?.toLowerCase().includes(currentPost.name.toLowerCase())
      );
    }

    // Fallback if still empty
    if (matched.length === 0) {
      matched = questions.slice(0, 10);
    }

    setPracticeQuestions(matched);
    setCurrentIdx(0);
    setUserAnswers({});
    setShowExplanation({});
    setPracticeFinished(false);
  };

  // Select Option during practice
  const handleSelectOption = (qId: string | number, optKey: string) => {
    if (userAnswers[qId]) return; // already answered
    setUserAnswers((prev) => ({ ...prev, [qId]: optKey }));
    setShowExplanation((prev) => ({ ...prev, [qId]: true }));
  };

  // Calculate practice score
  const scoreResult = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    practiceQuestions.forEach((q) => {
      const ans = userAnswers[q.id];
      if (ans) {
        if (ans === q.correct_answer) {
          correct += 1;
        } else {
          wrong += 1;
        }
      }
    });
    return {
      correct,
      wrong,
      total: practiceQuestions.length,
      answered: Object.keys(userAnswers).length,
      pct: practiceQuestions.length > 0 ? Math.round((correct / practiceQuestions.length) * 100) : 0,
    };
  }, [practiceQuestions, userAnswers]);

  // Finish Practice and save attempt
  const handleFinishPractice = () => {
    setPracticeFinished(true);

    if (student && activeTopic && currentPost) {
      saveStudentExamAttempt(student.id, {
        id: `topic-att-${Date.now()}`,
        exam_id: `topic-${activeTopic.id}`,
        exam_title: `${currentPost.name}: ${activeTopic.name} (বিষয়ভিত্তিক অনুশীলন)`,
        subject: currentPost.name,
        total_questions: practiceQuestions.length,
        correct_answers: scoreResult.correct,
        wrong_answers: scoreResult.wrong,
        score: scoreResult.correct,
        total_marks: practiceQuestions.length,
        date: 'আজকে, ' + new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      });
      if (onRefreshGrowth) {
        onRefreshGrowth();
      }
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400 space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
        <p className="text-xs font-semibold">বিষয়ভিত্তিক পদ ও সিলেবাস লোড হচ্ছে...</p>
      </div>
    );
  }

  // ACTIVE TOPIC PRACTICE VIEW
  if (activeTopic && currentPost) {
    const currentQ = practiceQuestions[currentIdx];
    const isAnswered = currentQ && Boolean(userAnswers[currentQ.id]);
    const selectedOpt = currentQ ? userAnswers[currentQ.id] : null;

    return (
      <div className="space-y-5 animate-fadeIn">
        {/* Top bar */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <button
            onClick={() => setActiveTopic(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>টপিক তালিকায় ফিরুন</span>
          </button>

          <div className="text-right">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              {currentPost.name}
            </span>
            <h3 className="text-xs sm:text-sm font-black text-white">{activeTopic.name}</h3>
          </div>
        </div>

        {!practiceFinished ? (
          currentQ ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
              {/* Question Progress Header */}
              <div className="flex items-center justify-between text-xs font-bold border-b border-slate-800 pb-3 text-slate-400">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>প্রশ্ন নং {currentIdx + 1} / {practiceQuestions.length}</span>
                </span>
                <span className="text-emerald-400 font-extrabold">
                  স্কোর: {scoreResult.correct} সঠিক
                </span>
              </div>

              {/* Question Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700 text-sm sm:text-base font-bold text-slate-100 leading-relaxed shadow-inner">
                {currentQ.question}
              </div>

              {/* 4 Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {[
                  { key: 'option_a', label: 'ক', text: currentQ.option_a },
                  { key: 'option_b', label: 'খ', text: currentQ.option_b },
                  { key: 'option_c', label: 'গ', text: currentQ.option_c },
                  { key: 'option_d', label: 'ঘ', text: currentQ.option_d },
                ].map((opt) => {
                  const isSelected = selectedOpt === opt.key;
                  const isCorrect = currentQ.correct_answer === opt.key;

                  let btnStyle = 'bg-slate-800/90 border-slate-700 hover:border-slate-600 text-slate-200';
                  let badgeStyle = 'bg-slate-700 text-slate-300';

                  if (isAnswered) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-100 ring-1 ring-emerald-500/50';
                      badgeStyle = 'bg-emerald-500 text-white font-black';
                    } else if (isSelected && !isCorrect) {
                      btnStyle = 'bg-rose-950/60 border-rose-500 text-rose-100 ring-1 ring-rose-500/50';
                      badgeStyle = 'bg-rose-500 text-white font-black';
                    } else {
                      btnStyle = 'bg-slate-850/50 border-slate-800 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={opt.key}
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(currentQ.id, opt.key)}
                      className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${btnStyle}`}
                    >
                      <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${badgeStyle}`}>
                        {opt.label}
                      </span>
                      <span className="text-xs sm:text-sm font-medium flex-1 pt-0.5 leading-snug">
                        {opt.text}
                      </span>
                      {isAnswered && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      {isAnswered && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Reveal */}
              {isAnswered && (
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-slate-200 space-y-1.5 animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-extrabold text-emerald-400">
                    <Info className="w-4 h-4" />
                    <span>ব্যাখ্যা ও সঠিক উত্তর</span>
                  </div>
                  <p className="leading-relaxed text-slate-300">
                    {currentQ.explanation || 'এই প্রশ্নের জন্য অতিরিক্ত নোট সংযোজিত নেই।'}
                  </p>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-bold transition-all"
                >
                  পূর্ববর্তী
                </button>

                {currentIdx < practiceQuestions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIdx((prev) => Math.min(practiceQuestions.length - 1, prev + 1))}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md flex items-center gap-1"
                  >
                    <span>পরবর্তী প্রশ্ন</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinishPractice}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-black shadow-lg"
                  >
                    অনুশীলন সমাপ্ত করুন
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs">
              এই টপিকের অধীনে কোনো প্রশ্ন পাওয়া যায়নি।
            </div>
          )
        ) : (
          /* PRACTICE RESULT VIEW */
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">বিষয়ভিত্তিক অনুশীলন সম্পন্ন!</h3>
              <p className="text-xs text-slate-400 mt-1">
                {currentPost.name} &bull; {activeTopic.name}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
              <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold">সঠিক উত্তর</span>
                <p className="text-lg font-black text-emerald-400">{scoreResult.correct}</p>
              </div>
              <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold">ভুল উত্তর</span>
                <p className="text-lg font-black text-rose-400">{scoreResult.wrong}</p>
              </div>
              <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold">মোট প্রশ্ন</span>
                <p className="text-lg font-black text-slate-200">{scoreResult.total}</p>
              </div>
              <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold">নির্ভুলতা</span>
                <p className="text-lg font-black text-teal-400">{scoreResult.pct}%</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleStartTopicPractice(activeTopic)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>পুনরায় অনুশীলন</span>
              </button>

              <button
                onClick={() => setActiveTopic(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                অন্য টপিক বেছে নিন
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // POST & TOPICS SELECTION VIEW
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-850 p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-extrabold text-teal-400 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> পদভিত্তিক সিলেবাস ও স্বয়ংক্রিয় প্রশ্নব্যাংক
          </span>
          <h2 className="text-lg sm:text-xl font-black text-white mt-1">
            বিষয়ভিত্তিক ও পদভিত্তিক প্রস্তুতি
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            আপনার পদ নির্বাচন করুন এবং প্রতিটি টপিক অনুযায়ী কুইজ ও অনুশীলন শুরু করুন
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start sm:self-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="রিফ্রেশ করুন"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Post Selector Tabs (Horizontal Scrollable) */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-400">
          পদ / বিভাগ নির্বাচন করুন:
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {posts.map((post) => {
            const isSelected = post.id === selectedPostId;
            return (
              <button
                key={post.id}
                onClick={() => setSelectedPostId(post.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-950 scale-102 border border-emerald-400/30'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{post.icon || '📚'}</span>
                <span>{post.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {post.topics.length} টপিক
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Post Info Card & Topics Grid */}
      {currentPost && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <span>{currentPost.icon || '🎓'}</span>
                <span>{currentPost.name} সিলেবাস ও টপিকসমূহ</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentPost.tagline || currentPost.description || 'নিচের যেকোনো টপিকে ক্লিক করে অনুশীলন শুরু করুন।'}
              </p>
            </div>
          </div>

          {/* Topics List Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentPost.topics.map((topic, idx) => {
              const qCount = getQuestionCountForTopic(currentPost.name, topic.name);
              return (
                <div
                  key={topic.id}
                  onClick={() => handleStartTopicPractice(topic)}
                  className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 transition-all duration-200 flex items-center justify-between group cursor-pointer shadow-md hover:shadow-xl hover:bg-slate-850"
                >
                  <div className="space-y-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 text-[11px] font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-extrabold text-xs sm:text-sm text-white group-hover:text-emerald-400 transition-colors leading-snug">
                        {topic.name}
                      </h4>
                    </div>

                    <p className="text-[11px] text-slate-400 pl-7">
                      প্রশ্নব্যাংক রিসোর্স: <strong className="text-emerald-400">{qCount}+ টি প্রশ্ন</strong>
                    </p>
                  </div>

                  <button className="p-2.5 rounded-xl bg-emerald-600/20 group-hover:bg-emerald-600 text-emerald-400 group-hover:text-white transition-all shadow shrink-0">
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
