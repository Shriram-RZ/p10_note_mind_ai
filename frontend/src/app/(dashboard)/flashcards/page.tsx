"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Plus, Loader2, ChevronLeft, ChevronRight, RotateCcw, Check, X, Brain, Sparkles } from "lucide-react";
import { flashcardsAPI, aiAPI } from "@/lib/api";
import type { FlashcardDeck, Flashcard } from "@/types";
import { cn } from "@/lib/utils";

function GenerateForm({ onGenerate }: { onGenerate: (data: Record<string, unknown>) => void }) {
  const [text, setText] = useState("");
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const { data } = await aiAPI.generateFlashcards({ text, count, difficulty });
      onGenerate(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea value={text} onChange={(e) => setText(e.target.value)}
        className="w-full h-32 px-4 py-3 rounded-xl glass border border-white/10 text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none resize-none text-sm"
        placeholder="Paste your study material here to generate flashcards..." />
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-white/50 text-xs mb-1 block">Cards</label>
          <select value={count} onChange={(e) => setCount(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none">
            {[5,10,15,20].map(n => <option key={n} value={n}>{n} cards</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-white/50 text-xs mb-1 block">Difficulty</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>
      <motion.button type="submit" disabled={!text.trim() || loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        className="w-full py-3 rounded-xl gradient-bg text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Flashcards</>}
      </motion.button>
    </form>
  );
}

function StudyMode({ deck, cards, onClose }: { deck: FlashcardDeck; cards: Flashcard[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Record<number, boolean>>({});

  const current = cards[index];
  const progress = (Object.keys(results).length / cards.length) * 100;

  const handleAnswer = async (correct: boolean) => {
    setResults(prev => ({ ...prev, [current.id]: correct }));
    try { await flashcardsAPI.review({ card_id: current.id, is_correct: correct }); } catch {}
    if (index < cards.length - 1) {
      setIndex(i => i + 1);
      setFlipped(false);
    }
  };

  const done = Object.keys(results).length === cards.length;
  const correct = Object.values(results).filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-gray-950/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold">{deck.title}</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/5 text-sm">Exit</button>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full mb-6 overflow-hidden">
          <motion.div className="h-full gradient-bg rounded-full" animate={{ width: `${progress}%` }} />
        </div>

        {!done ? (
          <>
            <motion.div onClick={() => setFlipped(f => !f)} className="cursor-pointer" style={{ perspective: 1000 }}>
              <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.5 }} style={{ transformStyle: "preserve-3d" }}
                className="relative h-64">
                <div className="absolute inset-0 glass rounded-2xl border border-white/10 flex flex-col items-center justify-center p-6 backface-hidden">
                  <div className="text-xs text-violet-400 mb-4 uppercase tracking-widest">Question</div>
                  <p className="text-white text-xl font-bold text-center">{current?.front}</p>
                  {current?.hint && !flipped && <p className="text-white/30 text-xs mt-4">💡 {current.hint}</p>}
                  <p className="text-white/20 text-xs mt-6">Tap to reveal answer</p>
                </div>
                <div className="absolute inset-0 glass rounded-2xl border border-violet-500/20 bg-violet-900/20 flex flex-col items-center justify-center p-6" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                  <div className="text-xs text-violet-400 mb-4 uppercase tracking-widest">Answer</div>
                  <p className="text-white text-lg text-center">{current?.back}</p>
                </div>
              </motion.div>
            </motion.div>

            <AnimatePresence>
              {flipped && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex gap-4 mt-6">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleAnswer(false)}
                    className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 font-semibold flex items-center justify-center gap-2">
                    <X className="w-5 h-5" /> Missed
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleAnswer(true)}
                    className="flex-1 py-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-300 font-semibold flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" /> Got it!
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="text-center text-white/30 text-sm mt-4">{index + 1} / {cards.length}</div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-8 text-center border border-white/10">
            <div className="text-6xl mb-4">{correct / cards.length >= 0.8 ? "🎉" : correct / cards.length >= 0.5 ? "👍" : "💪"}</div>
            <h3 className="text-2xl font-black text-white mb-2">Session Complete!</h3>
            <p className="text-white/50 mb-4">{correct}/{cards.length} correct</p>
            <div className="text-4xl font-black gradient-text">{Math.round((correct / cards.length) * 100)}%</div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function FlashcardsPage() {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [studyDeck, setStudyDeck] = useState<FlashcardDeck | null>(null);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);

  useEffect(() => {
    flashcardsAPI.decks().then(({ data }) => setDecks(data)).finally(() => setLoading(false));
  }, []);

  const handleStudy = async (deck: FlashcardDeck) => {
    const { data } = await flashcardsAPI.cards(deck.id);
    setStudyCards(data.cards);
    setStudyDeck(deck);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            Flashcards
          </h1>
          <p className="text-white/40 mt-1">AI-generated spaced repetition decks</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowGenerate(s => !s)}
          className="px-5 py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Generate Deck
        </motion.button>
      </div>

      <AnimatePresence>
        {showGenerate && (
          <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl p-6 border border-violet-500/20">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Brain className="w-5 h-5 text-violet-400" /> Generate from Content</h3>
            <GenerateForm onGenerate={(data) => {
              flashcardsAPI.decks().then(({ data: d }) => setDecks(d));
              setShowGenerate(false);
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 glass rounded-2xl shimmer border border-white/10" />)}
        </div>
      ) : decks.length === 0 ? (
        <div className="text-center py-20">
          <CreditCard className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white/30 mb-2">No flashcard decks yet</h3>
          <button onClick={() => setShowGenerate(true)} className="px-5 py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold mt-2">
            Generate First Deck
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck, i) => (
            <motion.div key={deck.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -3 }}
              className="glass rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-white/30 bg-white/5 px-2 py-1 rounded-lg">{deck.total_cards} cards</span>
              </div>
              <h3 className="font-bold text-white mb-1">{deck.title}</h3>
              {deck.subject && <p className="text-white/40 text-xs mb-3">{deck.subject}</p>}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-white/30 mb-1">
                  <span>Progress</span><span>{Math.round(deck.progress)}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${deck.progress}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full" />
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleStudy(deck)}
                className="w-full py-2 rounded-xl gradient-bg text-white text-sm font-semibold">
                Study Now
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {studyDeck && (
          <StudyMode deck={studyDeck} cards={studyCards} onClose={() => { setStudyDeck(null); setStudyCards([]); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
