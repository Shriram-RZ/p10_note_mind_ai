"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function SignupPage() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const [form, setForm] = useState({ email: "", username: "", full_name: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authAPI.signup(form);
      const { data } = await authAPI.login({ email: form.email, password: form.password });
      setTokens(data.access_token, data.refresh_token);
      const { data: user } = await authAPI.me();
      setUser(user);
      router.push("/dashboard");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl" />
      </div>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black gradient-text">NoteMind AI</span>
          </Link>
          <h1 className="text-3xl font-black text-white mb-2">Create your account</h1>
          <p className="text-white/50">Start your AI learning journey today</p>
        </div>
        <div className="glass rounded-3xl p-8 border border-white/10">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
              {error}
            </motion.div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-white/70 text-sm mb-2 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass border border-white/10 text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none transition-colors"
                  placeholder="John Doe" />
              </div>
            </div>
            <div>
              <label className="text-white/70 text-sm mb-2 block">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="text" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass border border-white/10 text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none transition-colors"
                  placeholder="johndoe" />
              </div>
            </div>
            <div>
              <label className="text-white/70 text-sm mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass border border-white/10 text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none transition-colors"
                  placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="text-white/70 text-sm mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type={showPassword ? "text" : "password"} required minLength={8} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-3 rounded-xl glass border border-white/10 text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none transition-colors"
                  placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="w-full py-3 rounded-xl gradient-bg text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : "Create Account"}
            </motion.button>
          </form>
          <p className="text-center text-white/50 text-sm mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
