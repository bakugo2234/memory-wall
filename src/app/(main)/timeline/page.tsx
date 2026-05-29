"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Clock, Sparkles, CalendarHeart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Post } from "@/types";
import { groupPostsByMonth, isSameDayDifferentYear, getYearsAgo } from "@/utils/dateFormat";
import { formatRelative } from "@/utils/dateFormat";

export default function TimelinePage() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts-timeline"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("posts")
        .select("*, user:users(*), reactions(*)")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      return (data as Post[]) || [];
    },
  });

  const onThisDay = posts?.filter((p) => isSameDayDifferentYear(p.created_at)) || [];
  const groups = groupPostsByMonth(posts || []);

  return (
    <div>
      {/* Header */}
      <motion.div className="mb-8" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
          <Clock className="w-8 h-8 text-violet-400" />
          Memory Wall
        </h1>
        <p className="text-slate-400">Hành trình kỷ niệm theo thời gian</p>
      </motion.div>

      {/* On This Day */}
      {onThisDay.length > 0 && (
        <motion.div
          className="relative rounded-3xl overflow-hidden mb-10 p-6"
          style={{ background: "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(124,58,237,0.1))", border: "1px solid rgba(236,72,153,0.3)" }}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10 blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, #ec4899, transparent)" }} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(236,72,153,0.2)", border: "1px solid rgba(236,72,153,0.4)" }}>
                <CalendarHeart className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">✨ Ngày Này Năm Xưa</h2>
                <p className="text-sm text-pink-400">Nhớ lại kỷ niệm cùng ngày này!</p>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {onThisDay.map((post) => (
                <Link key={post.id} href={`/post/${post.id}`} className="flex-shrink-0 group">
                  <div className="relative w-40 h-40 rounded-2xl overflow-hidden">
                    <Image
                      src={post.thumbnail_url || post.media_url}
                      alt={post.caption || "Memory"}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="160px"
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="text-xs text-white font-medium">{getYearsAgo(post.created_at)} năm trước</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-8">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="skeleton h-8 w-40 rounded-xl mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="skeleton rounded-2xl" style={{ height: "180px" }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Chưa có kỷ niệm nào được lưu giữ</p>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((group, gi) => (
            <motion.div
              key={group.date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.1 }}
              className="relative"
            >
              {/* Month header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-2xl gradient-bg flex items-center justify-center shadow-lg flex-shrink-0">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white capitalize">{group.label}</h2>
                  <p className="text-sm text-slate-500">{group.posts.length} kỷ niệm</p>
                </div>
                <div className="flex-1 divider" />
              </div>

              {/* Timeline connector */}
              {gi < groups.length - 1 && (
                <div className="absolute left-5 top-14 bottom-0 w-0.5 -mb-10"
                  style={{ background: "linear-gradient(to bottom, rgba(124,58,237,0.3), transparent)" }} />
              )}

              {/* Posts grid */}
              <div className="ml-14 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {group.posts.map((post, pi) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: gi * 0.1 + pi * 0.04 }}
                  >
                    <Link href={`/post/${post.id}`} className="group block">
                      <div className="relative rounded-2xl overflow-hidden bg-black/30"
                        style={{ aspectRatio: "1" }}>
                        <Image
                          src={post.thumbnail_url || post.media_url}
                          alt={post.caption || "Memory"}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
                        <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-xs text-white line-clamp-2">{post.caption || formatRelative(post.created_at)}</p>
                        </div>
                        {/* Reaction count badge */}
                        {post.reactions && post.reactions.length > 0 && (
                          <div className="absolute top-2 right-2">
                            <span className="text-xs bg-black/60 text-white px-1.5 py-0.5 rounded-full">
                              ❤️ {post.reactions.length}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
