"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Zap, BookOpen, Brain, TrendingUp, Clock, Flame, Star } from "lucide-react";
import { dashboardAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatRelativeTime, bytesToSize } from "@/lib/utils";
import type { DashboardStats } from "@/types";
import Link from "next/link";

interface DashboardData {
  stats: DashboardStats;
  recent_notes: Array<{ id: number; title: string; color: string; word_count: number; created_at: string; updated_at?: string }>;
  recent_files: Array<{ id: number; filename: string; file_type: string; file_size: number; created_at: string }>;
  weekly_activity: Array<{ date: string; notes: number; day: string }>;
}

const statCards = (stats: DashboardStats) => [
  { label: "Total Notes", value: stats.total_notes, icon: FileText, color: "from-violet-500 to-purple-600", change: `+${stats.notes_this_week} this week` },
  { label: "AI Summaries", value: stats.total_summaries, icon: Brain, color: "from-blue-500 to-cyan-600", change: "Generated" },
  { label: "Flashcard Decks", value: stats.total_flashcard_decks, icon: BookOpen, color: "from-emerald-500 to-teal-600", change: "Study sets" },
  { label: "Study Streak", value: stats.study_streak, icon: Flame, color: "from-orange-500 to-amber-600", change: "days" },
];

function StatCard({ label, value, icon: Icon, color, change, index }: { label: string; value: number; icon: React.ElementType; color: string; change: string; index: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="glass rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <TrendingUp className="w-4 h-4 text-green-400" />
      </div>
      <div className="text-3xl font-black text-white mb-1">{value}</div>
      <div className="text-white/50 text-sm font-medium">{label}</div>
      <div className="text-white/30 text-xs mt-1">{change}</div>
    </motion.div>
  );
}

function ShimmerCard() {
  return (
    <div className="glass rounded-2xl p-6 border border-white/10">
      <div className="w-12 h-12 rounded-xl shimmer bg-white/10 mb-4" />
      <div className="h-8 w-16 shimmer bg-white/10 rounded mb-2" />
      <div className="h-4 w-24 shimmer bg-white/10 rounded" />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.stats().then(({ data }) => {
      setData(data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-white mb-1">
              {greeting()}, {user?.full_name?.split(" ")[0] || user?.username} 👋
            </h1>
            <p className="text-white/40">Here is your learning overview for today.</p>
          </div>
          <Link href="/summarizer">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="px-5 py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold flex items-center gap-2 glow-sm">
              <Zap className="w-4 h-4" /> New Summary
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <ShimmerCard key={i} />)
        ) : data?.stats ? (
          statCards(data.stats).map((s, i) => <StatCard key={s.label} {...s} index={i} />)
        ) : null}
      </div>

      {/* Activity + Recent Notes */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Activity */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass rounded-2xl p-6 border border-white/10">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-400" /> Weekly Activity
          </h2>
          {loading ? (
            <div className="h-32 shimmer bg-white/5 rounded-xl" />
          ) : (
            <div className="flex items-end gap-2 h-32">
              {data?.weekly_activity?.map((day, i) => {
                const max = Math.max(...(data?.weekly_activity?.map(d => d.notes) || [1]));
                const height = max > 0 ? Math.max((day.notes / max) * 100, 8) : 8;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div initial={{ height: 0 }} animate={{ height: `${height}%` }} transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-purple-400 min-h-[4px]" />
                    <span className="text-xs text-white/30">{day.day}</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6 border border-white/10">
          <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { href: "/notes", label: "New Note", icon: "📝", color: "bg-violet-500/20 hover:bg-violet-500/30" },
              { href: "/summarizer", label: "Summarize Lecture", icon: "🎙️", color: "bg-blue-500/20 hover:bg-blue-500/30" },
              { href: "/flashcards", label: "Study Flashcards", icon: "🃏", color: "bg-emerald-500/20 hover:bg-emerald-500/30" },
              { href: "/chat", label: "Chat with AI", icon: "💬", color: "bg-orange-500/20 hover:bg-orange-500/30" },
              { href: "/mind-maps", label: "Create Mind Map", icon: "🗺️", color: "bg-pink-500/20 hover:bg-pink-500/30" },
            ].map((action, i) => (
              <Link key={i} href={action.href}>
                <motion.div whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${action.color}`}>
                  <span>{action.icon}</span>
                  <span className="text-sm text-white/70 font-medium">{action.label}</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Notes */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="glass rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-400" /> Recent Notes
          </h2>
          <Link href="/notes" className="text-violet-400 text-sm hover:text-violet-300">View all →</Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 shimmer bg-white/5 rounded-xl" />
            ))}
          </div>
        ) : data?.recent_notes?.length === 0 ? (
          <div className="text-center py-8 text-white/30">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No notes yet. Create your first note!</p>
            <Link href="/notes">
              <button className="mt-3 px-4 py-2 rounded-xl gradient-bg text-white text-sm font-medium">Create Note</button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {data?.recent_notes?.map((note, i) => (
              <Link key={note.id} href={`/notes?id=${note.id}`}>
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer group">
                  <div className="w-3 h-10 rounded-full flex-shrink-0" style={{ background: note.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-white/80 font-medium truncate group-hover:text-white">{note.title}</div>
                    <div className="text-white/30 text-xs">{note.word_count} words · {formatRelativeTime(note.updated_at || note.created_at)}</div>
                  </div>
                  <Star className="w-4 h-4 text-white/10 group-hover:text-yellow-400 transition-colors" />
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
