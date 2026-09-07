import React, { useState, useEffect } from 'react';
import { fetchAllQuestions } from '../lib/supabase';
import { Question } from '../types';
import { PracticeSection } from '../components/questionBank/PracticeSection';

export const PracticePage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { questions: data } = await fetchAllQuestions();
        setQuestions(data || []);
      } catch (err) {
        console.error('Error loading questions for practice page:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-400 py-12">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono">প্রশ্ন ব্যাংকের তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  return <PracticeSection questions={questions} />;
};
