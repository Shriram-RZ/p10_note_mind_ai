"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, Upload, Trash2, Loader2, FileText, Music, Video, Image, File } from "lucide-react";
import { filesAPI } from "@/lib/api";
import type { UploadedFile } from "@/types";
import { formatRelativeTime, bytesToSize, cn } from "@/lib/utils";

const typeIcons: Record<string, React.ElementType> = {
  pdf: FileText, docx: FileText, doc: FileText, txt: FileText,
  audio: Music, video: Video, image: Image,
};

const typeColors: Record<string, string> = {
  pdf: "from-red-500 to-orange-500",
  docx: "from-blue-500 to-cyan-500",
  audio: "from-purple-500 to-pink-500",
  video: "from-orange-500 to-amber-500",
  image: "from-green-500 to-teal-500",
  txt: "from-gray-500 to-slate-500",
};

export default function FilesPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadFiles = () => {
    filesAPI.list().then(({ data }) => setFiles(data)).finally(() => setLoading(false));
  };

  useEffect(() => { loadFiles(); }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("process_immediately", "true");
    try {
      await filesAPI.upload(formData);
      loadFiles();
    } catch (e) { console.error(e); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: number) => {
    await filesAPI.delete(id);
    setFiles(f => f.filter(x => x.id !== id));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-white mb-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <FolderOpen className="w-6 h-6 text-white" />
          </div>
          Files
        </h1>
        <p className="text-white/40">Upload and manage your study materials</p>
      </motion.div>

      {/* Upload Zone */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        className={cn("glass rounded-2xl p-10 border-2 border-dashed transition-all cursor-pointer text-center",
          dragOver ? "border-violet-500/60 bg-violet-500/10" : "border-white/10 hover:border-white/20")}>
        <input ref={fileRef} type="file" className="hidden" multiple
          accept=".mp3,.mp4,.wav,.m4a,.pdf,.docx,.txt,.md,.jpg,.png"
          onChange={(e) => Array.from(e.target.files || []).forEach(handleUpload)} />
        <AnimatePresence mode="wait">
          {uploading ? (
            <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Loader2 className="w-12 h-12 text-violet-400 mx-auto mb-3 animate-spin" />
              <p className="text-white/70 font-semibold">Uploading & processing...</p>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Upload className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/50 font-semibold mb-1">Drop files here or click to upload</p>
              <p className="text-white/20 text-sm">PDF, DOCX, TXT, Audio, Video, Images · Max 100MB</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Files grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 glass rounded-2xl shimmer border border-white/10" />)}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <FolderOpen className="w-16 h-16 mx-auto mb-3 opacity-20" />
          <p>No files uploaded yet</p>
        </div>
      ) : (
        <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {files.map((file, i) => {
              const Icon = typeIcons[file.file_type] || File;
              const color = typeColors[file.file_type] || "from-gray-500 to-slate-500";
              return (
                <motion.div key={file.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }} whileHover={{ y: -2 }}
                  className="glass rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all group">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-medium truncate">{file.filename}</p>
                      <p className="text-white/30 text-xs mt-0.5">{bytesToSize(file.file_size)} · {file.file_type.toUpperCase()}</p>
                      <div className={cn("inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                        file.is_processed ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400")}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", file.is_processed ? "bg-green-400" : "bg-yellow-400")} />
                        {file.is_processed ? "Processed" : "Pending"}
                      </div>
                    </div>
                    <button onClick={() => handleDelete(file.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-white/20 text-xs mt-3">{formatRelativeTime(file.created_at)}</p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
