"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, ArrowRight, Loader2, Copy, CheckCircle, RefreshCw } from "lucide-react";
import { aiAPI } from "@/lib/api";

const LANGUAGES = [
  { code: "en", name: "English" }, { code: "es", name: "Spanish" }, { code: "fr", name: "French" },
  { code: "de", name: "German" }, { code: "zh", name: "Chinese" }, { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" }, { code: "ja", name: "Japanese" }, { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" }, { code: "ko", name: "Korean" }, { code: "it", name: "Italian" },
  { code: "tr", name: "Turkish" }, { code: "nl", name: "Dutch" }, { code: "pl", name: "Polish" },
];

export default function TranslatorPage() {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("es");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [detectedLang, setDetectedLang] = useState("");

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setLoading(true);
    try {
      const { data } = await aiAPI.translate({
        text: sourceText,
        source_language: sourceLang,
        target_language: targetLang,
      });
      setTranslatedText(data.translated_text);
      setDetectedLang(data.source_language);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwap = () => {
    setSourceText(translatedText);
    setTranslatedText(sourceText);
    setSourceLang(targetLang);
    setTargetLang(sourceLang === "auto" ? "en" : sourceLang);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-white mb-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Globe className="w-6 h-6 text-white" />
          </div>
          AI Translator
        </h1>
        <p className="text-white/40">Translate your notes and lectures into 100+ languages</p>
      </motion.div>

      {/* Language selectors */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-4 border border-white/10 flex items-center gap-4">
        <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-violet-500/50">
          <option value="auto">Auto Detect</option>
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
        <motion.button onClick={handleSwap} whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}
          className="p-2 rounded-xl glass border border-white/10 text-white/50 hover:text-white transition-colors">
          <ArrowRight className="w-5 h-5" />
        </motion.button>
        <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-violet-500/50">
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
      </motion.div>

      {/* Translation boxes */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="glass rounded-2xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-white/50 text-sm font-medium">
              {sourceLang === "auto" ? "Source (Auto)" : LANGUAGES.find(l => l.code === sourceLang)?.name}
              {detectedLang && sourceLang === "auto" && <span className="ml-2 text-violet-400 text-xs">Detected: {detectedLang}</span>}
            </span>
            <span className="text-white/20 text-xs">{sourceText.length} chars</span>
          </div>
          <textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)}
            className="w-full h-64 p-4 bg-transparent text-white/80 placeholder-white/20 focus:outline-none resize-none text-sm leading-relaxed"
            placeholder="Type or paste text to translate..." />
          <div className="px-4 py-3 border-t border-white/10">
            <motion.button onClick={handleTranslate} disabled={!sourceText.trim() || loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="w-full py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              {loading ? "Translating..." : "Translate"}
            </motion.button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-2xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-white/50 text-sm font-medium">
              {LANGUAGES.find(l => l.code === targetLang)?.name}
            </span>
            <button onClick={handleCopy} disabled={!translatedText}
              className="flex items-center gap-1.5 text-white/30 hover:text-white/60 transition-colors text-xs disabled:opacity-30">
              {copied ? <><CheckCircle className="w-3.5 h-3.5 text-green-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </button>
          </div>
          <div className="h-64 p-4 overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="space-y-2 pt-2">
                {[100, 80, 90, 70].map((w, i) => (
                  <div key={i} className={`h-4 shimmer bg-white/10 rounded`} style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : translatedText ? (
              <p className="text-white/80 text-sm leading-relaxed">{translatedText}</p>
            ) : (
              <p className="text-white/20 text-sm">Translation will appear here...</p>
            )}
          </div>
          <div className="px-4 py-3 border-t border-white/10 flex justify-end">
            <button onClick={handleSwap} className="flex items-center gap-1.5 text-white/30 hover:text-white/60 transition-colors text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Swap languages
            </button>
          </div>
        </motion.div>
      </div>

      {/* Quick translate chips */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="flex flex-wrap gap-2">
        {["Spanish", "French", "German", "Chinese", "Arabic", "Hindi"].map(lang => {
          const l = LANGUAGES.find(x => x.name === lang);
          return l ? (
            <button key={lang} onClick={() => setTargetLang(l.code)}
              className="px-3 py-1.5 rounded-xl glass border border-white/10 text-white/50 hover:text-white/70 text-xs transition-all hover:border-white/20">
              → {lang}
            </button>
          ) : null;
        })}
      </motion.div>
    </div>
  );
}
