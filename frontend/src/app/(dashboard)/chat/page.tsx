"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Brain, User, Loader2, MessageSquare, Plus, Sparkles, ChevronRight } from "lucide-react";
import { aiAPI, chatAPI } from "@/lib/api";
import { formatRelativeTime, cn } from "@/lib/utils";
import type { ChatMessage, ChatSession } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatAPI.sessions().then(({ data }) => setSessions(data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (currentSession) {
      chatAPI.messages(currentSession).then(({ data }) => setMessages(data)).catch(console.error);
    }
  }, [currentSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { id: Date.now(), role: "user", content: userMessage, created_at: new Date().toISOString() }]);
    setTyping(true);
    setLoading(true);
    try {
      const { data } = await aiAPI.chat({
        message: userMessage,
        session_id: currentSession,
        context_type: "general",
      });
      if (!currentSession) {
        setCurrentSession(data.session_id);
        const { data: sessions } = await chatAPI.sessions();
        setSessions(sessions);
      }
      setMessages(prev => [...prev, { id: data.message_id, role: "assistant", content: data.response, created_at: new Date().toISOString() }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now(), role: "assistant", content: "Sorry, I encountered an error. Please try again.", created_at: new Date().toISOString() }]);
    } finally {
      setLoading(false);
      setTyping(false);
    }
  };

  const starters = [
    "Explain this concept in simple terms",
    "Create a study schedule for my exams",
    "What are the key topics I should focus on?",
    "Help me understand this formula",
  ];

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex gap-5">
      {/* Sessions sidebar */}
      <div className="w-64 flex-shrink-0 glass rounded-2xl border border-white/10 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-bold text-white text-sm">Chat Sessions</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          <button onClick={() => { setCurrentSession(null); setMessages([]); }}
            className="w-full flex items-center gap-2 p-2.5 rounded-xl hover:bg-white/5 text-white/50 hover:text-white/70 transition-all text-sm">
            <Plus className="w-4 h-4" /> New Chat
          </button>
          {sessions.map(s => (
            <button key={s.id} onClick={() => setCurrentSession(s.id)}
              className={cn("w-full flex items-start gap-2 p-2.5 rounded-xl transition-all text-left",
                currentSession === s.id ? "bg-violet-500/20 text-violet-300" : "hover:bg-white/5 text-white/50 hover:text-white/70")}>
              <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium truncate">{s.title || "Chat"}</div>
                <div className="text-xs text-white/20 mt-0.5">{formatRelativeTime(s.updated_at || s.created_at)}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 glass rounded-2xl border border-white/10 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">NoteMind AI Assistant</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-white/30">Online</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">How can I help you study?</h3>
              <p className="text-white/30 text-sm mb-6 max-w-xs">Ask me anything about your notes, or get help with any topic.</p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                {starters.map((s, i) => (
                  <motion.button key={i} whileHover={{ scale: 1.02 }} onClick={() => { setInput(s); }}
                    className="p-3 rounded-xl glass border border-white/10 text-white/50 hover:text-white/70 text-xs text-left transition-all hover:border-white/20">
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i === messages.length - 1 ? 0 : 0 }}
                  className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn("w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold",
                    msg.role === "user" ? "bg-white/10" : "gradient-bg")}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                  </div>
                  <div className={cn("max-w-[75%] rounded-2xl px-4 py-3 text-sm",
                    msg.role === "user" ? "bg-violet-600/30 text-white" : "glass border border-white/10 text-white/80")}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-invert prose-sm max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
                    ) : msg.content}
                  </div>
                </motion.div>
              ))}
              {typing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg gradient-bg flex-shrink-0 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div className="glass border border-white/10 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400"
                          animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              className="flex-1 px-4 py-3 rounded-xl glass border border-white/10 text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none text-sm"
              placeholder="Ask about your notes, get explanations..." />
            <motion.button onClick={handleSend} disabled={!input.trim() || loading} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center disabled:opacity-40">
              {loading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Send className="w-5 h-5 text-white" />}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
