"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Mic, Brain, FileText, Loader2, CheckCircle, X, Sparkles, List, Tag, Zap } from "lucide-react";
import { aiAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

type SummaryResult = {
  summary: string;
  key_points: string[];
  topics: string[];
  action_items: string[];
  important_concepts?: string[];
  filename?: string;
};

type ProcessState = "idle" | "uploading" | "processing" | "done" | "error";

export default function SummarizerPage() {
  const [state, setState] = useState<ProcessState>("idle");
  const [text, setText] = useState("");
  const [summaryType, setSummaryType] = useState("lecture");
  const [language, setLanguage] = useState("en");
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("summary");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setState("uploading");
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("summary_type", summaryType);
    formData.append("language", language);
    try {
      setState("processing");
      const { data } = await aiAPI.uploadAndSummarize(formData);
      if (data.error) { setError(data.error); setState("error"); return; }
      setResult(data);
      setState("done");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || "Failed to process file");
      setState("error");
    }
  };

  const handleTextSummarize = async () => {
    if (!text.trim()) return;
    setState("processing");
    setError("");
    try {
      const { data } = await aiAPI.summarize({ text, summary_type: summaryType, language });
      setResult(data);
      setState("done");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || "Summarization failed");
      setState("error");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const tabs = ["summary", "key_points", "topics", "action_items"];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-white mb-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          AI Lecture Summarizer
        </h1>
        <p className="text-white/40 ml-13">Upload audio, video, or paste text — get instant smart summaries</p>
      </motion.div>

      {/* Options */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-5 border border-white/10 flex flex-wrap gap-4">
        <div>
          <label className="text-white/50 text-xs mb-1.5 block">Summary Type</label>
          <select value={summaryType} onChange={(e) => setSummaryType(e.target.value)}
            className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-violet-500/50">
            <option value="lecture">Lecture</option>
            <option value="meeting">Meeting</option>
            <option value="general">General</option>
            <option value="research">Research Paper</option>
          </select>
        </div>
        <div>
          <label className="text-white/50 text-xs mb-1.5 block">Output Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-violet-500/50">
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="zh">Chinese</option>
            <option value="ar">Arabic</option>
            <option value="hi">Hindi</option>
            <option value="ja">Japanese</option>
          </select>
        </div>
      </motion.div>

      {state === "idle" || state === "error" ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* File Upload */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="glass rounded-2xl p-8 border-2 border-dashed border-white/10 hover:border-violet-500/40 transition-all cursor-pointer text-center group">
              <input ref={fileRef} type="file" className="hidden" accept=".mp3,.mp4,.wav,.m4a,.pdf,.docx,.txt"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <Upload className="w-12 h-12 text-violet-400/60 mx-auto mb-3 group-hover:text-violet-400 transition-colors" />
              </motion.div>
              <h3 className="text-white/70 font-semibold mb-1 group-hover:text-white">Drop your file here</h3>
              <p className="text-white/30 text-sm">Audio, Video, PDF, DOCX, TXT</p>
              <div className="mt-3 px-4 py-1.5 rounded-xl gradient-bg text-white text-xs font-medium inline-block">Browse Files</div>
            </div>
          </motion.div>

          {/* Text Input */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <div className="glass rounded-2xl p-5 border border-white/10 flex flex-col h-full">
              <h3 className="text-white/70 font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-400" /> Paste Text
              </h3>
              <textarea value={text} onChange={(e) => setText(e.target.value)}
                className="flex-1 bg-transparent text-white/70 placeholder-white/20 focus:outline-none resize-none text-sm leading-relaxed min-h-[140px]"
                placeholder="Paste your lecture notes, article, or any text here..." />
              <motion.button onClick={handleTextSummarize} disabled={!text.trim()} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="mt-3 w-full py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
                <Sparkles className="w-4 h-4" /> Summarize
              </motion.button>
            </div>
          </motion.div>
        </div>
      ) : null}

      {/* Processing State */}
      <AnimatePresence>
        {(state === "uploading" || state === "processing") && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="glass rounded-2xl p-12 border border-violet-500/20 text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">
              {state === "uploading" ? "Uploading file..." : "AI is analyzing..."}
            </h3>
            <p className="text-white/40 text-sm">This may take a moment for audio/video files</p>
            <div className="mt-4 w-48 h-1.5 bg-white/10 rounded-full mx-auto overflow-hidden">
              <motion.div className="h-full gradient-bg rounded-full" animate={{ width: ["0%", "100%"] }} transition={{ duration: 3, repeat: Infinity }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {state === "error" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="glass rounded-2xl p-5 border border-red-500/30 bg-red-500/10">
            <p className="text-red-300 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {state === "done" && result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Summary generated!</span>
                {result.filename && <span className="text-white/30 text-sm">· {result.filename}</span>}
              </div>
              <button onClick={() => { setState("idle"); setResult(null); }}
                className="text-white/30 hover:text-white/60 p-1 rounded-lg hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
              {tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={cn("px-4 py-1.5 rounded-xl text-sm font-medium capitalize transition-all",
                    activeTab === tab ? "gradient-bg text-white" : "glass border border-white/10 text-white/50 hover:text-white/70")}>
                  {tab.replace("_", " ")}
                </button>
              ))}
            </div>

            <div className="glass rounded-2xl p-6 border border-white/10">
              {activeTab === "summary" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-white/70 leading-relaxed text-sm">{result.summary}</p>
                </motion.div>
              )}
              {activeTab === "key_points" && (
                <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  {result.key_points?.map((pt, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-2 text-white/70 text-sm">
                      <Zap className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                      {pt}
                    </motion.li>
                  ))}
                </motion.ul>
              )}
              {activeTab === "topics" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
                  {result.topics?.map((t, i) => (
                    <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                      className="px-3 py-1.5 rounded-xl bg-violet-500/20 text-violet-300 text-sm border border-violet-500/20">
                      {t}
                    </motion.span>
                  ))}
                </motion.div>
              )}
              {activeTab === "action_items" && (
                <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  {result.action_items?.length > 0 ? result.action_items.map((item, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-2 text-white/70 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </motion.li>
                  )) : <p className="text-white/30 text-sm">No specific action items identified.</p>}
                </motion.ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
