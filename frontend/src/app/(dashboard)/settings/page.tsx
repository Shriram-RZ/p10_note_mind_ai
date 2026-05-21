"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, User, Bell, Shield, Palette, Loader2, CheckCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    bio: "",
    preferred_language: "en",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/auth/me", form);
      setUser(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const sections = [
    { icon: User, label: "Profile", active: true },
    { icon: Bell, label: "Notifications", active: false },
    { icon: Shield, label: "Security", active: false },
    { icon: Palette, label: "Appearance", active: false },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          Settings
        </h1>
      </motion.div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="glass rounded-2xl border border-white/10 p-3 space-y-1 h-fit">
          {sections.map((s, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all ${s.active ? "bg-violet-500/20 text-violet-300" : "text-white/40 hover:text-white/60 hover:bg-white/5"}`}>
              <s.icon className="w-4 h-4" />
              {s.label}
            </div>
          ))}
        </div>

        <div className="md:col-span-3 glass rounded-2xl border border-white/10 p-6 space-y-5">
          <h2 className="text-white font-bold">Profile Settings</h2>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-white text-2xl font-black">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold">{user?.username}</p>
              <p className="text-white/40 text-sm">{user?.email}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-green-400 text-xs">Active</span>
              </div>
            </div>
          </div>

          {[
            { label: "Full Name", key: "full_name", type: "text", placeholder: "Your full name" },
            { label: "Bio", key: "bio", type: "textarea", placeholder: "Tell us about yourself..." },
          ].map(field => (
            <div key={field.key}>
              <label className="text-white/50 text-sm mb-1.5 block">{field.label}</label>
              {field.type === "textarea" ? (
                <textarea value={form[field.key as keyof typeof form]} onChange={(e) => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  className="w-full h-20 px-4 py-3 rounded-xl glass border border-white/10 text-white placeholder-white/20 focus:border-violet-500/50 focus:outline-none resize-none text-sm"
                  placeholder={field.placeholder} />
              ) : (
                <input type={field.type} value={form[field.key as keyof typeof form]} onChange={(e) => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-white placeholder-white/20 focus:border-violet-500/50 focus:outline-none text-sm"
                  placeholder={field.placeholder} />
              )}
            </div>
          ))}

          <div>
            <label className="text-white/50 text-sm mb-1.5 block">Preferred Language</label>
            <select value={form.preferred_language} onChange={(e) => setForm(f => ({ ...f, preferred_language: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50">
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
            </select>
          </div>

          <motion.button onClick={handleSave} disabled={saving} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            className="px-6 py-2.5 rounded-xl gradient-bg text-white font-semibold flex items-center gap-2 disabled:opacity-60 text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4 text-green-400" /> : null}
            {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="glass rounded-2xl border border-white/10 p-5">
        <h3 className="text-white font-bold mb-4">Account Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Study Streak", value: `${user?.study_streak || 0} days`, icon: "🔥" },
            { label: "Study Time", value: `${user?.total_study_minutes || 0} mins`, icon: "⏱️" },
            { label: "Member Since", value: user?.created_at ? new Date(user.created_at).getFullYear().toString() : "-", icon: "📅" },
            { label: "Status", value: "Active", icon: "✅" },
          ].map((stat, i) => (
            <div key={i} className="text-center p-3 rounded-xl bg-white/5">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-white font-bold text-sm">{stat.value}</div>
              <div className="text-white/30 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
