"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Brain, Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black gradient-text">NoteMind AI</span>
          </Link>
          <h1 className="text-3xl font-black text-white mb-2">Reset Password</h1>
          <p className="text-white/50">Enter your email to receive a reset link</p>
        </div>
        <div className="glass rounded-3xl p-8 border border-white/10">
          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Email Sent!</h3>
              <p className="text-white/50 text-sm mb-6">Check your inbox for a password reset link.</p>
              <Link href="/login" className="text-violet-400 hover:text-violet-300 text-sm">Back to login</Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-white/70 text-sm mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl glass border border-white/10 text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none transition-colors"
                    placeholder="you@example.com" />
                </div>
              </div>
              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="w-full py-3 rounded-xl gradient-bg text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : "Send Reset Link"}
              </motion.button>
              <Link href="/login" className="flex items-center justify-center gap-2 text-white/50 hover:text-white/70 text-sm mt-2">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </Link>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
