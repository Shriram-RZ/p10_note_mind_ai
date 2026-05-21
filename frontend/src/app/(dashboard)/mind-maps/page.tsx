"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map, Plus, Loader2, Sparkles, Eye, Trash2, Network } from "lucide-react";
import { mindMapsAPI, aiAPI } from "@/lib/api";
import type { MindMap } from "@/types";
import { formatRelativeTime, cn } from "@/lib/utils";

interface MindMapNode { id: string; label: string; level: number; type: string; }
interface MindMapEdge { id: string; source: string; target: string; }
interface MindMapData { id: number; title: string; nodes: MindMapNode[]; edges: MindMapEdge[]; }

function MindMapViewer({ data, onClose }: { data: MindMapData; onClose: () => void }) {
  const nodesByLevel: Record<number, MindMapNode[]> = {};
  (data.nodes || []).forEach(n => {
    if (!nodesByLevel[n.level]) nodesByLevel[n.level] = [];
    nodesByLevel[n.level].push(n);
  });

  const levelColors = ["from-violet-500 to-purple-600", "from-blue-500 to-cyan-600", "from-emerald-500 to-teal-600", "from-orange-500 to-amber-600"];
  const levelSizes = ["text-xl font-black", "text-base font-bold", "text-sm font-semibold", "text-xs font-medium"];

  return (
    <div className="fixed inset-0 bg-gray-950/97 backdrop-blur-xl z-50 flex flex-col overflow-auto p-6">
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-gray-950/80 backdrop-blur z-10 py-2">
        <h2 className="text-white font-bold text-xl">{data.title}</h2>
        <button onClick={onClose} className="px-3 py-1.5 rounded-xl glass border border-white/10 text-white/60 hover:text-white text-sm">Close</button>
      </div>
      <div className="flex flex-col items-center gap-8 min-h-full pb-10">
        {Object.entries(nodesByLevel).map(([level, nodes]) => (
          <div key={level} className="w-full">
            <div className="flex flex-wrap justify-center gap-3">
              {nodes.map((node, i) => (
                <motion.div key={node.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-white text-center cursor-default",
                    Number(level) === 0
                      ? `bg-gradient-to-br ${levelColors[0]} shadow-lg shadow-violet-500/30 px-8 py-4`
                      : `bg-gradient-to-br ${levelColors[Number(level) % levelColors.length] || "from-gray-500 to-slate-600"} opacity-80`
                  )}>
                  <span className={levelSizes[Number(level)] || "text-xs"}>{node.label}</span>
                </motion.div>
              ))}
            </div>
            {Number(level) < Object.keys(nodesByLevel).length - 1 && (
              <div className="flex justify-center mt-4">
                <div className="w-px h-6 bg-white/20" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function GenerateForm({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState("");
  const [depth, setDepth] = useState(3);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      await aiAPI.generateMindMap({ text, depth });
      onDone();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5">
      <textarea value={text} onChange={(e) => setText(e.target.value)}
        className="w-full h-28 px-4 py-3 rounded-xl glass border border-white/10 text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none resize-none text-sm"
        placeholder="Paste content to generate a mind map..." />
      <div>
        <label className="text-white/50 text-xs mb-1.5 block">Depth (levels)</label>
        <select value={depth} onChange={(e) => setDepth(Number(e.target.value))}
          className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none">
          {[2,3,4].map(n => <option key={n} value={n}>{n} levels</option>)}
        </select>
      </div>
      <motion.button type="submit" disabled={!text.trim() || loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        className="w-full py-3 rounded-xl gradient-bg text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Mind Map</>}
      </motion.button>
    </form>
  );
}

export default function MindMapsPage() {
  const [maps, setMaps] = useState<MindMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [activeMap, setActiveMap] = useState<MindMapData | null>(null);

  const loadMaps = () => {
    mindMapsAPI.list().then(({ data }) => setMaps(data)).finally(() => setLoading(false));
  };

  useEffect(() => { loadMaps(); }, []);

  const handleView = async (id: number) => {
    const { data } = await mindMapsAPI.get(id);
    setActiveMap(data);
  };

  const handleDelete = async (id: number) => {
    await mindMapsAPI.delete(id);
    setMaps(m => m.filter(x => x.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
              <Map className="w-6 h-6 text-white" />
            </div>
            Mind Maps
          </h1>
          <p className="text-white/40 mt-1">AI-generated visual knowledge maps</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowGenerate(s => !s)}
          className="px-5 py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Map
        </motion.button>
      </div>

      <AnimatePresence>
        {showGenerate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl border border-violet-500/20 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-bold flex items-center gap-2"><Network className="w-4 h-4 text-violet-400" /> Generate Mind Map</h3>
            </div>
            <GenerateForm onDone={() => { setShowGenerate(false); loadMaps(); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 glass rounded-2xl shimmer border border-white/10" />)}
        </div>
      ) : maps.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <Map className="w-16 h-16 mx-auto mb-3 opacity-20" />
          <p>No mind maps yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {maps.map((map, i) => (
            <motion.div key={map.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              className="glass rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                  <Map className="w-5 h-5 text-white" />
                </div>
                <button onClick={() => handleDelete(map.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-white mb-1 text-sm">{map.title}</h3>
              <p className="text-white/30 text-xs mb-4">{map.node_count} nodes · {formatRelativeTime(map.created_at)}</p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleView(map.id)}
                className="w-full py-2 rounded-xl gradient-bg text-white text-sm font-semibold flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" /> View Map
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {activeMap && <MindMapViewer data={activeMap} onClose={() => setActiveMap(null)} />}
      </AnimatePresence>
    </div>
  );
}
