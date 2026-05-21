"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pin, Archive, Heart, Tag, Trash2, Loader2, FileText, Sparkles, X } from "lucide-react";
import { notesAPI, tagsAPI } from "@/lib/api";
import type { Note, Tag as TagType } from "@/types";
import { formatRelativeTime, cn } from "@/lib/utils";

const COLORS = ["#6366f1","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899","#3b82f6"];

function NoteCard({ note, onSelect, onDelete, onTogglePin, onToggleFavorite }: {
  note: Note;
  onSelect: (n: Note) => void;
  onDelete: (id: number) => void;
  onTogglePin: (id: number) => void;
  onToggleFavorite: (id: number) => void;
}) {
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -3, scale: 1.01 }}
      onClick={() => onSelect(note)}
      className="glass rounded-2xl p-5 border border-white/10 hover:border-white/20 cursor-pointer group relative overflow-hidden transition-all"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: note.color }} />
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-white/90 text-sm leading-tight flex-1 pr-2 group-hover:text-white">{note.title}</h3>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(note.id); }}
            className={cn("p-1.5 rounded-lg hover:bg-white/10 transition-colors", note.is_favorite ? "text-yellow-400" : "text-white/30")}>
            <Heart className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onTogglePin(note.id); }}
            className={cn("p-1.5 rounded-lg hover:bg-white/10 transition-colors", note.is_pinned ? "text-violet-400" : "text-white/30")}>
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {note.content && (
        <p className="text-white/40 text-xs leading-relaxed mb-3 line-clamp-3">{note.content}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {note.tags?.slice(0, 2).map(tag => (
            <span key={tag.id} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: tag.color + "33", color: tag.color }}>
              {tag.name}
            </span>
          ))}
        </div>
        <span className="text-white/20 text-xs">{formatRelativeTime(note.updated_at || note.created_at)}</span>
      </div>
      {note.is_pinned && <div className="absolute top-2 right-2"><Pin className="w-3 h-3 text-violet-400" /></div>}
    </motion.div>
  );
}

function NoteEditor({ note, onSave, onClose }: { note: Partial<Note> | null; onSave: (data: Partial<Note>) => void; onClose: () => void }) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [color, setColor] = useState(note?.color || COLORS[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({ title, content, color });
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
      className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-gray-950/95 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col">
      <div className="flex items-center justify-between p-5 border-b border-white/10">
        <h2 className="font-bold text-white">{note?.id ? "Edit Note" : "New Note"}</h2>
        <div className="flex items-center gap-2">
          <motion.button onClick={handleSave} disabled={saving || !title.trim()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="px-4 py-1.5 rounded-xl gradient-bg text-white text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <></>}
            Save
          </motion.button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full text-2xl font-bold bg-transparent text-white placeholder-white/20 focus:outline-none"
          placeholder="Note title..." />
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className={cn("w-6 h-6 rounded-full transition-transform", color === c ? "scale-125 ring-2 ring-white/50" : "hover:scale-110")}
              style={{ background: c }} />
          ))}
        </div>
        <textarea value={content} onChange={(e) => setContent(e.target.value)}
          className="w-full h-96 bg-transparent text-white/70 placeholder-white/20 focus:outline-none resize-none text-sm leading-relaxed"
          placeholder="Start writing your note..." />
      </div>
    </motion.div>
  );
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedNote, setSelectedNote] = useState<Partial<Note> | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [filter, setFilter] = useState<"all" | "pinned" | "favorites">("all");

  const loadNotes = async () => {
    try {
      const params: Record<string, unknown> = {};
      if (search) params.search = search;
      if (filter === "pinned") params.is_pinned = true;
      if (filter === "favorites") params.is_favorite = true;
      const { data } = await notesAPI.list(params);
      setNotes(data.notes);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadNotes(); }, [search, filter]);

  const handleSave = async (noteData: Partial<Note>) => {
    if (selectedNote?.id) {
      await notesAPI.update(selectedNote.id, noteData);
    } else {
      await notesAPI.create(noteData);
    }
    setShowEditor(false);
    setSelectedNote(null);
    loadNotes();
  };

  const handleDelete = async (id: number) => {
    await notesAPI.delete(id);
    loadNotes();
  };

  const handleTogglePin = async (id: number) => {
    const note = notes.find(n => n.id === id);
    if (note) await notesAPI.update(id, { is_pinned: !note.is_pinned });
    loadNotes();
  };

  const handleToggleFavorite = async (id: number) => {
    const note = notes.find(n => n.id === id);
    if (note) await notesAPI.update(id, { is_favorite: !note.is_favorite });
    loadNotes();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">My Notes</h1>
          <p className="text-white/40 mt-1">{notes.length} notes total</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { setSelectedNote({}); setShowEditor(true); }}
          className="px-5 py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold flex items-center gap-2 glow-sm">
          <Plus className="w-4 h-4" /> New Note
        </motion.button>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass border border-white/10 text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none text-sm"
            placeholder="Search notes..." />
        </div>
        {(["all", "pinned", "favorites"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all",
              filter === f ? "gradient-bg text-white" : "glass border border-white/10 text-white/50 hover:text-white/70")}>
            {f}
          </button>
        ))}
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 border border-white/10 h-40 shimmer" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <FileText className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white/30 mb-2">No notes found</h3>
          <p className="text-white/20 mb-6">Create your first note to get started</p>
          <button onClick={() => { setSelectedNote({}); setShowEditor(true); }}
            className="px-5 py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold">
            Create Note
          </button>
        </motion.div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {notes.map(note => (
              <NoteCard key={note.id} note={note} onSelect={(n) => { setSelectedNote(n); setShowEditor(true); }}
                onDelete={handleDelete} onTogglePin={handleTogglePin} onToggleFavorite={handleToggleFavorite} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {showEditor && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40" onClick={() => setShowEditor(false)} />
            <NoteEditor note={selectedNote} onSave={handleSave} onClose={() => { setShowEditor(false); setSelectedNote(null); }} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
