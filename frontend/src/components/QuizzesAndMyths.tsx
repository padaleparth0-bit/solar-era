import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCw, 
  Award, 
  Lightbulb, 
  Flame, 
  ShieldCheck, 
  Edit3, 
  Loader2, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react';
import { SolarMyth, SolarQuizQuestion, GreenCitizenProfile } from '../types';
import { fetchMyths, fetchQuizQuestions } from '../services/api';
import { getStoredProfile, saveStoredProfile, recordQuizPoints, fetchStoredProfile } from '../utils/citizenStorage';
import { GreenCitizenModal } from './GreenCitizenModal';
import { GreenCitizenCertificateModal } from './GreenCitizenCertificateModal';
import confetti from 'canvas-confetti';

export const QuizzesAndMyths: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'myths' | 'quiz'>('myths');
  const [profile, setProfile] = useState<GreenCitizenProfile>(getStoredProfile());
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  
  // Myths state
  const [myths, setMyths] = useState<SolarMyth[]>([]);
  const [isMythsLoading, setIsMythsLoading] = useState<boolean>(true);
  const [mythsError, setMythsError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [flippedMythId, setFlippedMythId] = useState<string | null>(null);

  // Quiz state
  const [questions, setQuestions] = useState<SolarQuizQuestion[]>([]);
  const [isQuizLoading, setIsQuizLoading] = useState<boolean>(true);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isGeneratingAiQuiz, setIsGeneratingAiQuiz] = useState(false);

  // Sync profile updates and load from backend
  useEffect(() => {
    fetchStoredProfile()
      .then(setProfile)
      .catch((err) => console.warn('Could not fetch initial citizen profile:', err));

    const handleProfileUpdate = (e: any) => {
      if (e.detail) {
        setProfile(e.detail);
      }
    };
    window.addEventListener('solar_citizen_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('solar_citizen_profile_updated', handleProfileUpdate);
  }, []);

  // Fetch myths when category filter changes
  const loadMyths = async () => {
    setIsMythsLoading(true);
    setMythsError(null);
    try {
      const data = await fetchMyths(selectedCategory);
      setMyths(data);
    } catch (err: any) {
      setMythsError(err.message || 'Failed to load solar myths');
    } finally {
      setIsMythsLoading(false);
    }
  };

  useEffect(() => {
    loadMyths();
  }, [selectedCategory]);

  // Fetch quiz questions on mount
  const loadQuizQuestions = async () => {
    setIsQuizLoading(true);
    setQuizError(null);
    try {
      const data = await fetchQuizQuestions();
      setQuestions(data);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setScore(0);
      setStreak(0);
      setQuizCompleted(false);
    } catch (err: any) {
      setQuizError(err.message || 'Failed to load quiz questions');
    } finally {
      setIsQuizLoading(false);
    }
  };

  useEffect(() => {
    loadQuizQuestions();
  }, []);

  const currentQ = questions[currentQuestionIndex] || questions[0];

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || !currentQ) return;
    setIsAnswerSubmitted(true);

    const isCorrect = selectedOption === currentQ.correctIndex;
    if (isCorrect) {
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
      try {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.7 }
        });
      } catch (err) {}
    } else {
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    if (!currentQ) return;
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setQuizCompleted(true);
      // Persist progress to Citizen Profile & backend citizens table
      const finalScore = score + (selectedOption === currentQ.correctIndex && !isAnswerSubmitted ? 1 : 0);
      recordQuizPoints(finalScore, 1)
        .then(updated => setProfile(updated))
        .catch(err => {
          console.warn('Could not save quiz points to backend:', err);
          // Fallback in-memory update
          setProfile(prev => ({
            ...prev,
            totalQuizScore: (prev.totalQuizScore || 0) + finalScore,
            quizzesCompletedCount: (prev.quizzesCompletedCount || 0) + 1
          }));
        });

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.5 },
          colors: ['#f59e0b', '#10b981', '#6366f1']
        });
      } catch (err) {}
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setStreak(0);
    setQuizCompleted(false);
  };

  // Generate AI Solar Quiz questions via server-side Gemini endpoint
  const handleGenerateAiQuiz = async () => {
    setIsGeneratingAiQuiz(true);
    try {
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'Indian Rooftop Solar, PM Surya Ghar Muft Bijli Yojana & Net Metering',
          difficulty: 'Intermediate'
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.quizzes) && data.quizzes.length > 0) {
        setQuestions(data.quizzes);
        handleRestartQuiz();
      }
    } catch (err) {
      console.error('Error fetching AI quiz:', err);
    } finally {
      setIsGeneratingAiQuiz(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Citizen Profile & Progress Header Bar */}
      <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold shadow-2xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-900">
                Citizen: {profile.fullName || 'Registered Solar Learner'}
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-mono px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                {profile.certificateId || 'IND-GC-ACTIVE'}
              </span>
            </div>
            <p className="text-[11px] text-stone-600">
              Quiz Points: <strong className="text-emerald-700 font-mono">{(profile.totalQuizScore || 0) * 10} pts</strong> • Quizzes Solved: <strong className="text-emerald-700 font-mono">{profile.quizzesCompletedCount || 0}</strong> • Location: <strong>{profile.city}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Profile Tracker</span>
          </button>
          <button
            onClick={() => setShowCertificateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all hover:scale-102 cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            <span>View Certificate</span>
          </button>
        </div>
      </div>

      {/* Header & Subtabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-0.5 rounded-full text-xs font-semibold shadow-2xs">
            <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
            <span>Customer Solar Awareness & Education</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            Solar <span className="text-emerald-600">Mythbusters & Knowledge Quizzes</span>
          </h2>
          <p className="text-xs text-stone-600">
            Uncover the facts on monsoon efficiency, rooftop safety, DISCOM DBT subsidies, and track your Solar Quotient!
          </p>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 shadow-2xs">
          <button
            onClick={() => setActiveTab('myths')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'myths'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            🕵️ Solar Mythbusters
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'quiz'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            🎯 Solar Challenge Quiz
          </button>
        </div>
      </div>

      {/* MYTHBUSTERS TAB */}
      {activeTab === 'myths' && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs text-stone-600 font-medium whitespace-nowrap">Filter Topics:</span>
            {['all', 'Weather & Monsoon', 'Cost & Subsidies', 'Roof & Structure', 'Battery & Grid', 'Maintenance'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
                }`}
              >
                {cat === 'all' ? '🌟 All Myths' : cat}
              </button>
            ))}
          </div>

          {/* Loading Indicator */}
          {isMythsLoading && (
            <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center shadow-sm space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-stone-700">Loading solar myths from SQLite database...</p>
            </div>
          )}

          {/* Error Notice */}
          {mythsError && !isMythsLoading && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-amber-800 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span>Could not load solar myths</span>
              </div>
              <p className="text-xs text-amber-700">{mythsError}</p>
              <button
                onClick={loadMyths}
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Myths Cards Grid */}
          {!isMythsLoading && !mythsError && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myths.map((item) => {
                const isFlipped = flippedMythId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setFlippedMythId(isFlipped ? null : item.id)}
                    className="group cursor-pointer bg-white border border-stone-200 hover:border-emerald-400 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between"
                  >
                    {/* Category Chip */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                      <span className="text-[10px] text-stone-500 group-hover:text-emerald-700 transition-colors">
                        {isFlipped ? 'Click for Myth' : 'Click for Truth 🔍'}
                      </span>
                    </div>

                    {/* Myth vs Fact */}
                    {!isFlipped ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <span className="text-rose-700 font-extrabold text-xs uppercase bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            MYTH ❌
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-stone-900 leading-snug">
                          "{item.myth}"
                        </h4>
                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-emerald-700 font-semibold">
                          <span>Tap to reveal facts & proof</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-emerald-600" />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <span className="text-emerald-800 font-extrabold text-xs uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            THE TRUTH ✅
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-emerald-800 leading-snug">
                          {item.fact}
                        </h4>
                        <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200">
                          {item.detailedTruth}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* QUIZ TAB */}
      {activeTab === 'quiz' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Quiz Top Action Bar */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm text-xs">
            <div className="flex items-center gap-4">
              <span className="text-stone-600">
                Question <strong className="text-emerald-700">{questions.length > 0 ? currentQuestionIndex + 1 : 0}</strong> of <strong>{questions.length}</strong>
              </span>
              <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg font-bold font-mono border border-emerald-200">
                Session Score: {score}
              </span>
              {streak > 1 && (
                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 border border-emerald-300">
                  <Flame className="w-3.5 h-3.5 text-emerald-600" /> {streak} Streak!
                </span>
              )}
            </div>

            <button
              onClick={handleGenerateAiQuiz}
              disabled={isGeneratingAiQuiz}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-bold shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGeneratingAiQuiz ? 'Generating with Gemini AI...' : '✨ Generate AI Quiz'}</span>
            </button>
          </div>

          {/* Quiz Loading Indicator */}
          {isQuizLoading && (
            <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center shadow-sm space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-stone-700">Loading quiz questions from database...</p>
            </div>
          )}

          {/* Quiz Error Notice */}
          {quizError && !isQuizLoading && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-amber-800 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span>Could not load quiz questions</span>
              </div>
              <p className="text-xs text-amber-700">{quizError}</p>
              <button
                onClick={loadQuizQuestions}
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {!isQuizLoading && !quizError && currentQ && !quizCompleted && (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-6">
              {/* Question Category */}
              <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                {currentQ.category}
              </span>

              {/* Question Text */}
              <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 leading-snug">
                {currentQ.question}
              </h3>

              {/* Options List */}
              <div className="space-y-3">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQ.correctIndex;

                  let optionStyle = 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200';

                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                    } else if (isSelected && !isCorrect) {
                      optionStyle = 'bg-rose-50 border-rose-400 text-rose-900';
                    } else {
                      optionStyle = 'bg-stone-50 border-stone-200 text-stone-400 opacity-60';
                    }
                  } else if (isSelected) {
                    optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isAnswerSubmitted}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between text-xs sm:text-sm cursor-pointer ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-white border border-stone-300 flex items-center justify-center font-bold text-xs shrink-0 text-stone-700 shadow-2xs">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </div>

                      {isAnswerSubmitted && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      {isAnswerSubmitted && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Detailed Explanation Box after submitting */}
              {isAnswerSubmitted && (
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-1.5 text-xs animate-fadeIn">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <Lightbulb className="w-4 h-4 text-emerald-600" />
                    <span>Detailed Solar Fact Explanation:</span>
                  </div>
                  <p className="text-stone-700 leading-relaxed">
                    {currentQ.explanation}
                  </p>
                </div>
              )}

              {/* Submit / Next Button */}
              <div className="flex items-center justify-end pt-2">
                {!isAnswerSubmitted ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedOption === null}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <span>{currentQuestionIndex + 1 === questions.length ? 'View Final Score & Update Profile' : 'Next Question'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {!isQuizLoading && !quizError && quizCompleted && (
            /* Quiz Completed Scorecard */
            <div className="bg-white border border-emerald-200 rounded-2xl p-8 text-center space-y-6 shadow-sm">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500 shadow-xs">
                <Award className="w-9 h-9" />
              </div>

              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-emerald-700">
                  CHALLENGE COMPLETED & PROGRESS SAVED
                </span>
                <h3 className="text-2xl font-extrabold text-stone-900 mt-1">
                  Solar Energy Champion Scorecard
                </h3>
              </div>

              <div className="text-5xl font-extrabold font-mono text-emerald-600">
                {score} / {questions.length}
              </div>

              <p className="text-xs text-stone-600 max-w-md mx-auto">
                {score === questions.length 
                  ? `🌟 Outstanding, ${profile.fullName}! You have mastered Indian solar policy, net metering, and PM Surya Ghar economics!` 
                  : score >= Math.ceil(questions.length / 2)
                  ? `👍 Great job, ${profile.fullName}! You have solid solar awareness. Your Green Citizen credentials are now updated!`
                  : `🌱 Good effort, ${profile.fullName}! Review our Solar Mythbusters module to boost your knowledge on tariffs and subsidies.`}
              </p>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs text-stone-700 max-w-md mx-auto">
                <span>Green Citizen ID: <strong className="text-emerald-700 font-mono">{profile.certificateId}</strong></span>
                <span>Lifetime Score: <strong className="text-emerald-700 font-mono">{(profile.totalQuizScore || 0) * 10} pts</strong></span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleRestartQuiz}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5 text-stone-600" />
                  <span>Retry Quiz</span>
                </button>
                <button
                  onClick={handleGenerateAiQuiz}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>New AI Generated Quiz</span>
                </button>
                <button
                  onClick={() => setShowCertificateModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>View Green Certificate</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <GreenCitizenModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={profile}
        onProfileUpdated={(updated) => setProfile(updated)}
      />

      <GreenCitizenCertificateModal
        isOpen={showCertificateModal}
        onClose={() => setShowCertificateModal(false)}
        profile={profile}
        totalCo2SavedKg={Math.round((profile.solarSystemKw || 3.3) * 1450 * 2.5 * 0.82)}
        treesEquivalent={Math.round(((profile.solarSystemKw || 3.3) * 1450 * 2.5 * 0.82) / 20)}
        coalSavedKg={Math.round((profile.solarSystemKw || 3.3) * 1450 * 2.5 * 0.45)}
        totalUnitsGenerated={Math.round((profile.solarSystemKw || 3.3) * 1450 * 2.5)}
      />
    </div>
  );
};
