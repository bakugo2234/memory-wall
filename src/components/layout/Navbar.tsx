"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Home,
  BookImage,
  Clock,
  Upload,
  Shield,
  Bell,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, useUIStore } from "@/store";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Feed", icon: Home },
  { href: "/albums", label: "Albums", icon: BookImage },
  { href: "/timeline", label: "Timeline", icon: Clock },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuthStore();
  const { openUploadModal } = useUIStore();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch pending posts count for admin badge
  const { data: pendingCount } = useQuery({
    queryKey: ["pending-count"],
    queryFn: async () => {
      if (!isAdmin()) return 0;
      const supabase = createClient();
      const { count } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      return count || 0;
    },
    enabled: isAdmin(),
    refetchInterval: 30000,
  });

  // Fetch unread notifications count
  const { data: notifCount } = useQuery({
    queryKey: ["notif-count"],
    queryFn: async () => {
      if (!user) return 0;
      const supabase = createClient();
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <>
      <motion.nav
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
          scrolled ? "glass shadow-xl shadow-black/20" : "bg-transparent"
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center shadow-lg group-hover:shadow-violet-500/30 transition-shadow">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg gradient-text">Memory Wall</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("nav-link", pathname === item.href && "active")}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
              {isAdmin() && (
                <Link
                  href="/admin"
                  className={cn("nav-link relative", pathname === "/admin" && "active")}
                >
                  <Shield className="w-4 h-4" />
                  Admin
                  {(pendingCount ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Upload button */}
              <motion.button
                onClick={openUploadModal}
                className="btn-primary hidden sm:flex items-center gap-2 py-2 px-4 text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <Upload className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Đăng ký niệm</span>
              </motion.button>

              {/* Notifications */}
              <Link href="/notifications" className="relative p-2 rounded-xl btn-ghost">
                <Bell className="w-5 h-5" />
                {(notifCount ?? 0) > 0 && (
                  <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-violet-500 ring-2 ring-black" />
                )}
              </Link>

              {/* Avatar */}
              <div className="relative group">
                <button className="w-9 h-9 rounded-xl overflow-hidden border-2 border-violet-500/30 hover:border-violet-500/60 transition-colors">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full gradient-bg flex items-center justify-center text-white text-sm font-bold">
                      {initials}
                    </div>
                  )}
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-48 glass-strong rounded-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl">
                  <div className="px-3 py-2 border-b border-white/5 mb-1">
                    <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <Link href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                    <span>👤</span> Hồ sơ
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-xl btn-ghost"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="md:hidden glass-strong border-t border-white/5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-4 py-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn("nav-link w-full", pathname === item.href && "active")}
                    onClick={() => setMobileOpen(false)}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
                {isAdmin() && (
                  <Link
                    href="/admin"
                    className={cn("nav-link w-full relative", pathname === "/admin" && "active")}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Shield className="w-4 h-4" />
                    Admin
                    {(pendingCount ?? 0) > 0 && (
                      <span className="ml-auto badge badge-pending">{pendingCount} chờ duyệt</span>
                    )}
                  </Link>
                )}
                <button
                  onClick={() => { openUploadModal(); setMobileOpen(false); }}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                >
                  <Upload className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Đăng ký niệm</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}
