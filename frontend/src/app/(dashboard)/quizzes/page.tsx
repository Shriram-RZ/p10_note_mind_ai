"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Plus, Loader2, CheckCircle, X, Trophy, Sparkles, ArrowRight } from "lucide-react";
import { quizzesAPI, aiAPI } from "@/lib/api";
import type { Quiz, QuizQuestion } from "@/types";
import { cn } from "@/lib/utils";

function GenerateForm({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState("");
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      await aiAPI.generateQuiz({ text, question_count: count, difficulty });
      onDone();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5">
      <textarea value={text} onChange={(e) => setText(e.target.value)}
        className="w-full h-28 px-4 py-3 rounded-xl glass border border-white/10 text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none resize-none text-sm"
        placeholder="Paste your content to generate a quiz..." />
      <div className="flex gap-3">
        <select value={count} onChange={(e) => setCount(Number(e.target.value))}
          className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none">
          {[5,10,15,20].map(n => <option key={n} value={n}>{n} questions</option>)}
        </select>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none">
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      <motion.button type="submit" disabled={!text.trim() || loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        className="w-full py-3 rounded-xl gradient-bg text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Quiz</>}
      </motion.button>
    </form>
  );
}

type QuizResult = { score: number; earned_points: number; total_points: number; results: Array<{ question_id: number; question: string; user_answer: string; correct_answer: string; is_correct: boolean; explanation: string }> };

function TakeQuiz({ quiz, questions, onClose }: { quiz: Quiz; questions: QuizQuestion[]; onClose: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data } = await quizzesAPI.submit(quiz.id, { answers });
      setResult(data);
      setSubmitted(true);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const q = questions[current];

  return (
    <div className="fixed inset-0 bg-gray-950/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold">{quiz.title}</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white text-sm px-3 py-1.5 rounded-xl hover:bg-white/5">Exit</button>
        </div>

        {!submitted ? (
          <>
            <div className="flex gap-1 mb-6">
              {questions.map((_, i) => (
                <div key={i} className={cn("flex-1 h-1.5 rounded-full transition-all", i < current ? "bg-violet-500" : i === current ? "gradient-bg" : "bg-white/10")} />
              ))}
            </div>
            <div className="glass rounded-2xl p-6 border border-white/10 mb-4">
              <div className="text-xs text-violet-400 mb-3 uppercase tracking-widest">Question {current + 1} of {questions.length}</div>
              <h3 className="text-white text-lg font-semibold mb-5">{q?.question}</h3>
              {q?.options?.length ? (
                <div className="space-y-3">
                  {q.options.map((opt, i) => (
                    <motion.button key={i} whileHover={{ scale: 1.01 }} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                      className={cn("w-full text-left p-4 rounded-xl border transition-all text-sm",
                        answers[q.id] === opt
                          ? "border-violet-500/50 bg-violet-500/20 text-white"
                          : "border-white/10 glass text-white/60 hover:border-white/20 hover:text-white/80")}>
                      {opt}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <input value={answers[q?.id] || ""} onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none"
                  placeholder="Type your answer..." />
              )}
            </div>
            <div className="flex gap-3">
              {current > 0 && (
                <button onClick={() => setCurrent(c => c - 1)} className="px-5 py-2.5 rounded-xl glass border border-white/10 text-white/60 hover:text-white text-sm">
                  Back
                </button>
              )}
              {current < questions.length - 1 ? (
                <motion.button whileHover={{ scale: 1.01 }} onClick={() => setCurrent(c => c + 1)} disabled={!answers[q?.id]}
                  className="flex-1 py-2.5 rounded-xl gradient-bg text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40">
                  Next <ArrowRight className="w-4 h-4" />
                </motion.button>
              ) : (
                <motion.button whileHover={{ scale: 1.01 }} onClick={handleSubmit} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl gradient-bg text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trophy className="w-4 h-4" /> Submit Quiz</>}
                </motion.button>
              )}
            </div>
          </>
        ) : result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-8 border border-white/10">
            <div className="text-center mb-6">
              <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <div className="text-5xl font-black gradient-text">{Math.round(result.score)}%</div>
              <p className="text-white/50 mt-1">{result.earned_points}/{result.total_points} points</p>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
              {result.results.map((r, i) => (
                <div key={i} className={cn("p-3 rounded-xl border text-sm", r.is_correct ? "border-green-500/20 bg-green-500/10" : "border-red-500/20 bg-red-500/10")}>
                  <div className="flex items-start gap-2 mb-1">
                    {r.is_correct ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> : <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                    <span className={cn("font-medium", r.is_correct ? "text-green-300" : "text-red-300")}>{r.question}</span>
                  </div>
                  {!r.is_correct && <p className="text-white/40 text-xs ml-6">Correct: {r.correct_answer}</p>}
                  {r.explanation && <p className="text-white/30 text-xs ml-6 mt-1">{r.explanation}</p>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<{ quiz: Quiz; questions: QuizQuestion[] } | null>(null);

  const loadQuizzes = () => {
    quizzesAPI.list().then(({ data }) => setQuizzes(data)).finally(() => setLoading(false));
  };

  useEffect(() => { loadQuizzes(); }, []);

  const handleTake = async (quiz: Quiz) => {
    const { data } = await quizzesAPI.get(quiz.id);
    setActiveQuiz({ quiz, questions: data.questions });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            Quizzes
          </h1>
          <p className="text-white/40 mt-1">AI-generated assessments</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowGenerate(s => !s)}
          className="px-5 py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Quiz
        </motion.button>
      </div>

      <AnimatePresence>
        {showGenerate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl border border-violet-500/20 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-400" /> Generate Quiz</h3>
            </div>
            <GenerateForm onDone={() => { setShowGenerate(false); loadQuizzes(); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 glass rounded-2xl shimmer border border-white/10" />)}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <HelpCircle className="w-16 h-16 mx-auto mb-3 opacity-20" />
          <p>No quizzes yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((quiz, i) => (
            <motion.div key={quiz.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              className="glass rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mb-3">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-white mb-1 text-sm">{quiz.title}</h3>
              <div className="flex items-center gap-3 text-xs text-white/30 mb-4">
                <span>{quiz.total_questions} questions</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="capitalize">{quiz.difficulty}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{quiz.attempt_count} attempts</span>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleTake(quiz)}
                className="w-full py-2 rounded-xl gradient-bg text-white text-sm font-semibold">
                Take Quiz
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {activeQuiz && (
          <TakeQuiz quiz={activeQuiz.quiz} questions={activeQuiz.questions} onClose={() => setActiveQuiz(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
