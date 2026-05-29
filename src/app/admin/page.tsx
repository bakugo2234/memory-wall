"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Loader2,
  BarChart3,
  ImageIcon,
  Film,
  Users,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Post } from "@/types";
import { formatRelative } from "@/utils/dateFormat";
import { useAuthStore } from "@/store";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const { user, isAdmin } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [rejectModalPost, setRejectModalPost] = useState<Post | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Guard: redirect non-admins
  if (user && !isAdmin()) {
    router.push("/");
    return null;
  }

  const { data: pendingPosts, isLoading } = useQuery({
    queryKey: ["admin-pending"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("posts")
        .select("*, user:users(*)")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      return (data as Post[]) || [];
    },
    refetchInterval: 15000,
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const supabase = createClient();
      const [{ count: total }, { count: approved }, { count: pending }, { count: users }] = await Promise.all([
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("users").select("*", { count: "exact", head: true }),
      ]);
      return { total: total || 0, approved: approved || 0, pending: pending || 0, users: users || 0 };
    },
  });

  const handleApprove = async (post: Post) => {
    if (!user) return;
    setIsProcessing(post.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("posts")
      .update({ status: "approved", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq("id", post.id);

    if (!error) {
      // Create notification for post owner
      await supabase.from("notifications").insert({
        user_id: post.user_id,
        actor_id: user.id,
        type: "approved",
        post_id: post.id,
      });
      toast.success("✅ Đã duyệt bài đăng!");
      queryClient.invalidateQueries({ queryKey: ["admin-pending"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["pending-count"] });
    } else {
      toast.error("Không thể duyệt bài");
    }
    setIsProcessing(null);
  };

  const handleReject = async () => {
    if (!rejectModalPost || !user) return;
    setIsProcessing(rejectModalPost.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("posts")
      .update({
        status: "rejected",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        reject_reason: rejectReason.trim() || null,
      })
      .eq("id", rejectModalPost.id);

    if (!error) {
      await supabase.from("notifications").insert({
        user_id: rejectModalPost.user_id,
        actor_id: user.id,
        type: "rejected",
        post_id: rejectModalPost.id,
      });
      toast.success("Đã từ chối bài đăng");
      queryClient.invalidateQueries({ queryKey: ["admin-pending"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["pending-count"] });
    } else {
      toast.error("Không thể từ chối bài");
    }
    setRejectModalPost(null);
    setRejectReason("");
    setIsProcessing(null);
  };

  return (
    <div>
      {/* Header */}
      <motion.div className="mb-8" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl gradient-bg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-500 text-sm">Duyệt bài và quản lý cộng đồng</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Tổng bài", value: stats?.total, icon: BarChart3, color: "text-violet-400" },
          { label: "Đã duyệt", value: stats?.approved, icon: CheckCircle2, color: "text-green-400" },
          { label: "Chờ duyệt", value: stats?.pending, icon: Clock, color: "text-yellow-400" },
          { label: "Thành viên", value: stats?.users, icon: Users, color: "text-pink-400" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="glass rounded-2xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <stat.icon className={cn("w-5 h-5 mb-2", stat.color)} />
            <p className="text-2xl font-bold text-white">{stat.value ?? "—"}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Pending queue */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-400" />
          Bài chờ duyệt
          {(pendingPosts?.length ?? 0) > 0 && (
            <span className="badge badge-pending">{pendingPosts?.length}</span>
          )}
        </h2>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
          </div>
        ) : pendingPosts?.length === 0 ? (
          <motion.div
            className="text-center py-16 glass rounded-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3 opacity-60" />
            <p className="text-white font-semibold mb-1">Không có bài nào chờ duyệt!</p>
            <p className="text-slate-500 text-sm">Tất cả đã được xử lý 🎉</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingPosts?.map((post, i) => (
              <motion.div
                key={post.id}
                className="glass rounded-2xl overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                {/* Media preview */}
                <div className="relative h-48 bg-black/30">
                  {post.media_type === "image" ? (
                    <Image
                      src={post.media_url}
                      alt="Preview"
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      {post.thumbnail_url ? (
                        <Image src={post.thumbnail_url} alt="Video thumbnail" fill className="object-cover" sizes="33vw" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-12 h-12 text-slate-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                          <Film className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="badge badge-pending">
                      {post.media_type === "image" ? <ImageIcon className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                      {post.media_type === "image" ? "Ảnh" : "Video"}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                      {post.user?.avatar_url ? (
                        <img src={post.user.avatar_url} alt={post.user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full gradient-bg flex items-center justify-center text-white text-xs font-bold">
                          {post.user?.name?.[0] || "?"}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{post.user?.name}</p>
                      <p className="text-xs text-slate-500">{formatRelative(post.created_at)}</p>
                    </div>
                  </div>
                  {post.caption && (
                    <p className="text-sm text-slate-400 line-clamp-2 mb-3">{post.caption}</p>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <a
                      href={post.media_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 btn-ghost flex items-center justify-center gap-1 text-sm py-2"
                    >
                      <Eye className="w-4 h-4" />
                      Xem
                    </a>
                    <motion.button
                      className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-sm font-medium transition-all"
                      style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}
                      onClick={() => handleApprove(post)}
                      disabled={isProcessing === post.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isProcessing === post.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Duyệt
                    </motion.button>
                    <motion.button
                      className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-sm font-medium transition-all"
                      style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
                      onClick={() => setRejectModalPost(post)}
                      disabled={isProcessing === post.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <XCircle className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModalPost && (
          <div className="modal-overlay" onClick={() => setRejectModalPost(null)}>
            <motion.div
              className="w-full max-w-md glass-strong rounded-3xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Từ chối bài đăng</h3>
                  <p className="text-sm text-slate-500">Nhập lý do để thông báo cho người đăng</p>
                </div>
              </div>
              <textarea
                className="textarea h-24 mb-4"
                placeholder="Lý do từ chối (tùy chọn)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="flex gap-3">
                <button className="btn-ghost flex-1" onClick={() => setRejectModalPost(null)}>Hủy</button>
                <button
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                  onClick={handleReject}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Từ chối"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
