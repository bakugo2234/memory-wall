"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, Check, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Notification } from "@/types";
import { useAuthStore } from "@/store";
import { formatRelative } from "@/utils/dateFormat";
import Link from "next/link";
import toast from "react-hot-toast";

const notifMessages: Record<string, string> = {
  comment: "đã bình luận về bài của bạn",
  reaction: "đã react bài của bạn",
  approved: "✅ Bài đăng của bạn đã được duyệt!",
  rejected: "❌ Bài đăng của bạn bị từ chối",
};

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!user) return [];
      const supabase = createClient();
      const { data } = await supabase
        .from("notifications")
        .select("*, actor:users(name, avatar_url), post:posts(id, media_url, thumbnail_url, media_type)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return (data as Notification[]) || [];
    },
    enabled: !!user,
  });

  const markAllRead = async () => {
    if (!user) return;
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notif-count"] });
    toast.success("Đã đánh dấu tất cả đã đọc");
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bell className="w-7 h-7 text-violet-400" />
            Thông báo
            {unreadCount > 0 && (
              <span className="badge badge-pending">{unreadCount} mới</span>
            )}
          </h1>
        </div>
        {unreadCount > 0 && (
          <button className="btn-ghost flex items-center gap-2 text-sm" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4" />
            Đọc tất cả
          </button>
        )}
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Chưa có thông báo nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, i) => (
            <motion.div
              key={notif.id}
              className="glass rounded-2xl p-4 flex items-center gap-4"
              style={{ borderColor: !notif.read_at ? "rgba(124,58,237,0.3)" : undefined }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              {!notif.read_at && (
                <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
              )}
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                {notif.actor?.avatar_url ? (
                  <img src={notif.actor.avatar_url} alt={notif.actor.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full gradient-bg flex items-center justify-center text-white text-sm font-bold">
                    {notif.actor?.name?.[0] || "?"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200">
                  <span className="font-semibold">{notif.actor?.name}</span>{" "}
                  {notifMessages[notif.type]}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{formatRelative(notif.created_at)}</p>
              </div>
              {notif.post_id && (
                <Link href={`/post/${notif.post_id}`} className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden">
                    <img
                      src={notif.post?.thumbnail_url || notif.post?.media_url || ""}
                      alt="post"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
