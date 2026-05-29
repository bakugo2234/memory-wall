"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Post } from "@/types";
import { PostCard } from "@/components/feed/PostCard";
import { formatDate } from "@/utils/dateFormat";

export default function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["album", id],
    queryFn: async () => {
      const supabase = createClient();

      const { data: album } = await supabase
        .from("albums")
        .select(`*, creator:users(name, avatar_url)`)
        .eq("id", id)
        .single();

      const { data: posts } = await supabase
        .from("posts")
        .select(`*, user:users(*), reactions(*)`)
        .eq("album_id", id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      const postsWithCounts = await Promise.all(
        ((posts as Post[]) || []).map(async (post) => {
          const { count } = await supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);
          return { ...post, _count: { reactions: post.reactions?.length || 0, comments: count || 0 } };
        })
      );

      return { album, posts: postsWithCounts };
    },
  });

  if (isLoading) {
    return (
      <div>
        <div className="skeleton h-48 rounded-3xl mb-6" />
        <div className="masonry">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="masonry-item skeleton rounded-2xl" style={{ height: "250px" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.album) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Album không tồn tại</p>
      </div>
    );
  }

  const { album, posts } = data;

  return (
    <div>
      {/* Back button */}
      <motion.button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại Albums
      </motion.button>

      {/* Album header */}
      <motion.div
        className="relative rounded-3xl overflow-hidden mb-8 p-8"
        style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.1))", border: "1px solid rgba(124,58,237,0.2)" }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">📁 {album.title}</h1>
          {album.description && <p className="text-slate-400 mb-4">{album.description}</p>}
          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-violet-400" />
              {posts.length} kỷ niệm
            </span>
            {album.event_date && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-pink-400" />
                {formatDate(album.event_date)}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          Chưa có bài đăng nào trong album này
        </div>
      ) : (
        <div className="masonry">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
