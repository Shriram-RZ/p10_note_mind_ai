"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Brain, Zap, BookOpen, Layers, MessageSquare, Star, ArrowRight, Sparkles, FileText, Globe, BarChart3, FlipHorizontal } from "lucide-react";

const features = [
  { icon: Brain, title: "AI Summarizer", desc: "Upload lectures and get instant concise summaries with key points", color: "from-violet-500 to-purple-600" },
  { icon: Sparkles, title: "Smart Notes", desc: "AI-enhanced note-taking with auto-formatting and insights", color: "from-blue-500 to-cyan-600" },
  { icon: Globe, title: "AI Translator", desc: "Translate notes and lectures into 100+ languages instantly", color: "from-emerald-500 to-teal-600" },
  { icon: MessageSquare, title: "Chat with Notes", desc: "Ask questions about your uploaded notes and get AI answers", color: "from-orange-500 to-amber-600" },
  { icon: FlipHorizontal, title: "Flashcards", desc: "Auto-generate spaced-repetition flashcard decks from any content", color: "from-pink-500 to-rose-600" },
  { icon: BarChart3, title: "Mind Maps", desc: "Visualize concepts with AI-generated interactive mind maps", color: "from-indigo-500 to-blue-600" },
];

const stats = [
  { value: "10x", label: "Faster studying" },
  { value: "50+", label: "AI features" },
  { value: "100+", label: "Languages" },
  { value: "∞", label: "Notes capacity" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen animated-bg text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">NoteMind AI</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
            <Link href="/login" className="text-white/70 hover:text-white transition-colors text-sm font-medium">Sign in</Link>
            <Link href="/signup" className="px-4 py-2 rounded-xl gradient-bg text-white text-sm font-semibold hover:opacity-90 transition-opacity glow-sm">
              Get Started Free
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-40 right-1/4 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-violet-500/30 text-violet-300 text-sm mb-8">
            <Sparkles className="w-4 h-4" /> Powered by Gemini AI
          </div>
          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
            Study Smarter with{" "}
            <span className="gradient-text">AI-Powered</span>{" "}
            Notes
          </h1>
          <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
            Upload lectures, generate smart notes, translate content, create flashcards, and chat with your study material — all in one intelligent workspace.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/signup">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="px-8 py-4 rounded-2xl gradient-bg text-white font-bold text-lg glow flex items-center gap-2">
                Start Learning Free <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <motion.button whileHover={{ scale: 1.02 }} className="px-8 py-4 rounded-2xl glass border border-white/20 text-white font-semibold text-lg">
              Watch Demo
            </motion.button>
          </div>
        </motion.div>

        {/* Dashboard preview */}
        <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4 }} className="mt-20 max-w-5xl mx-auto">
          <div className="glass rounded-3xl p-1 glow">
            <div className="bg-gray-900/80 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="grid grid-cols-4 gap-3">
                {["📝 Smart Notes", "🎙️ Lecture AI", "🃏 Flashcards", "🗺️ Mind Maps"].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.1 }}
                    className="glass rounded-xl p-3 text-center text-sm font-medium text-white/80">
                    {item}
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 glass rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-violet-400 mb-1">NoteMind AI</div>
                    <div className="text-sm text-white/80">Here&apos;s a summary of your uploaded lecture on <span className="text-violet-400">Machine Learning Fundamentals</span>...</div>
                    <div className="mt-2 space-y-1">
                      {["✓ Key concept: Supervised vs Unsupervised Learning", "✓ 5 flashcards generated", "✓ Quiz ready: 10 questions"].map((item, i) => (
                        <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 + i * 0.2 }}
                          className="text-xs text-white/50">{item}</motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="text-center">
              <div className="text-5xl font-black gradient-text mb-2">{stat.value}</div>
              <div className="text-white/50 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Everything You Need to <span className="gradient-text">Excel</span></h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">A complete AI-powered learning ecosystem that adapts to your study style.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="glass rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all cursor-pointer group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="max-w-3xl mx-auto glass rounded-3xl p-12 border border-violet-500/20">
          <h2 className="text-4xl font-black mb-4">Ready to Transform Your <span className="gradient-text">Learning?</span></h2>
          <p className="text-white/50 mb-8">Join thousands of students using NoteMind AI to study smarter, not harder.</p>
          <Link href="/signup">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="px-10 py-4 rounded-2xl gradient-bg text-white font-bold text-lg glow flex items-center gap-2 mx-auto">
              Get Started — It&apos;s Free <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10 text-center text-white/30 text-sm">
        <p>© 2025 NoteMind AI. Built with Next.js, FastAPI & Gemini AI.</p>
      </footer>
    </div>
  );
}
