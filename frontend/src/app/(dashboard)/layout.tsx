"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Sidebar from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/authStore";
import { authAPI } from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { isAuthenticated, setUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    authAPI.me().then(({ data }) => setUser(data)).catch(() => {
      router.push("/login");
    });
  }, [isAuthenticated, router, setUser]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <motion.main
        animate={{ marginLeft: collapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-1 min-h-screen overflow-x-hidden"
      >
        <div className="p-6 lg:p-8">{children}</div>
      </motion.main>
    </div>
  );
}
