"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, LayoutDashboard, FileText, Mic, Globe, MessageSquare,
  FolderOpen, CreditCard, HelpCircle, Map, Settings, LogOut,
  ChevronLeft, Menu, Zap, Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { authAPI } from "@/lib/api";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/notes", label: "My Notes", icon: FileText },
  { href: "/summarizer", label: "AI Summarizer", icon: Mic },
  { href: "/translator", label: "AI Translator", icon: Globe },
  { href: "/chat", label: "Chat with Notes", icon: MessageSquare },
  { href: "/files", label: "Files", icon: FolderOpen },
  { href: "/flashcards", label: "Flashcards", icon: CreditCard },
  { href: "/quizzes", label: "Quizzes", icon: HelpCircle },
  { href: "/mind-maps", label: "Mind Maps", icon: Map },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch {}
    logout();
    router.push("/login");
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen bg-gray-950/80 backdrop-blur-xl border-r border-white/5 flex flex-col fixed left-0 top-0 z-40 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 h-16">
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-lg gradient-text whitespace-nowrap">NoteMind AI</span>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center mx-auto">
            <Brain className="w-4 h-4 text-white" />
          </div>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} className="text-white/30 hover:text-white/70 transition-colors p-1 rounded-lg hover:bg-white/5">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <motion.div whileHover={{ x: collapsed ? 0 : 4 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group",
                  isActive
                    ? "bg-violet-600/20 text-violet-300 border border-violet-500/20"
                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-violet-400")} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap">
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && !collapsed && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/5">
        <div className={cn("flex items-center gap-3 px-3 py-2 rounded-xl", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            {user?.username?.[0]?.toUpperCase() || "U"}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                <div className="text-white/80 text-sm font-medium truncate">{user?.full_name || user?.username}</div>
                <div className="text-white/30 text-xs truncate">{user?.email}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button onClick={handleLogout}
          className={cn("flex items-center gap-3 px-3 py-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all w-full mt-1", collapsed && "justify-center")}>
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Sign Out</span>}
        </button>
      </div>
    </motion.aside>
  );
}
