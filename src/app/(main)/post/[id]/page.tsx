"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Send,
  Trash2,
  Play,
  Heart,
  MessageCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Post, Comment, ReactionEmoji } from "@/types";
import { useAuthStore } from "@/store";
import { formatRelative, formatFullDate } from "@/utils/dateFormat";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const REACTIONS: ReactionEmoji[] = ["❤️", "😂", "😮", "😢", "👍", "🎉"];

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAdmin } = useAuthStore();
  const queryClient = useQueryClient();
  const commentInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const [newComment, setNewComment] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [userReaction, setUserReaction] = useState<ReactionEmoji | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [showReactions, setShowReactions] = useState(false);

  // Fetch post
  const { data: post, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("posts")
        .select("*, user:users(*), reactions(*), album:albums(id, title)")
        .eq("id", id)
        .single();
      return data as Post;
    },
  });

  // Fetch comments with realtime
  const { data: comments = [] } = useQuery({
    queryKey: ["comments", id],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("comments")
        .select("*, user:users(*)")
        .eq("post_id", id)
        .order("created_at", { ascending: true });
      return (data as Comment[]) || [];
    },
  });

  // Set up realtime for comments
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`comments-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `post_id=eq.${id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["comments", id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, queryClient]);

  // Set up realtime for reactions
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`reactions-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reactions", filter: `post_id=eq.${id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["post", id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, queryClient]);

  // Build reaction state from post data
  useEffect(() => {
    if (post?.reactions) {
      const counts: Record<string, number> = {};
      post.reactions.forEach((r) => {
        counts[r.emoji] = (counts[r.emoji] || 0) + 1;
        if (r.user_id === user?.id) setUserReaction(r.emoji as ReactionEmoji);
      });
      setReactionCounts(counts);
    }
  }, [post, user]);

  const handleReaction = async (emoji: ReactionEmoji) => {
    if (!user) return;
    const supabase = createClient();
    setShowReactions(false);

    if (userReaction === emoji) {
      await supabase.from("reactions").delete().eq("post_id", id).eq("user_id", user.id);
      setReactionCounts((p) => ({ ...p, [emoji]: Math.max((p[emoji] || 0) - 1, 0) }));
      setUserReaction(null);
    } else {
      if (userReaction) {
        setReactionCounts((p) => ({ ...p, [userReaction]: Math.max((p[userReaction] || 0) - 1, 0) }));
      }
      await supabase.from("reactions").upsert({ post_id: id, user_id: user.id, emoji }, { onConflict: "post_id,user_id" });
      setReactionCounts((p) => ({ ...p, [emoji]: (p[emoji] || 0) + 1 }));
      setUserReaction(emoji);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !user || isSending) return;
    setIsSending(true);
    const supabase = createClient();
    const { error } = await supabase.from("comments").insert({
      post_id: id,
      user_id: user.id,
      content: newComment.trim(),
    });
    if (!error) {
      setNewComment("");
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      toast.error("Không thể gửi bình luận");
    }
    setIsSending(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const supabase = createClient();
    await supabase.from("comments").delete().eq("id", commentId);
    queryClient.invalidateQueries({ queryKey: ["comments", id] });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="skeleton h-96 rounded-3xl mb-4" />
        <div className="skeleton h-8 w-48 rounded-xl mb-2" />
        <div className="skeleton h-4 w-32 rounded-xl" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20 text-slate-400">
        Bài đăng không tồn tại
      </div>
    );
  }

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <motion.button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại
      </motion.button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Media */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="relative rounded-3xl overflow-hidden bg-black" style={{ minHeight: "300px" }}>
            {post.media_type === "image" ? (
              <Image
                src={post.media_url}
                alt={post.caption || "Memory"}
                width={post.width || 800}
                height={post.height || 600}
                className="w-full h-auto"
                style={{ maxHeight: "70vh", objectFit: "contain" }}
              />
            ) : (
              <video
                src={post.media_url}
                controls
                className="w-full max-h-[70vh]"
                poster={post.thumbnail_url || undefined}
              />
            )}
          </div>

          {/* Reactions */}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <div className="relative">
              <motion.button
                className={cn("reaction-btn text-base", userReaction && "active")}
                onClick={() => setShowReactions(!showReactions)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {userReaction || <Heart className="w-4 h-4" />}
                {totalReactions > 0 && <span className="text-sm font-medium">{totalReactions}</span>}
              </motion.button>

              <AnimatePresence>
                {showReactions && (
                  <motion.div
                    className="absolute bottom-full left-0 mb-2 flex gap-1 glass-strong rounded-2xl p-2 shadow-2xl z-10"
                    initial={{ opacity: 0, scale: 0.8, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 5 }}
                  >
                    {REACTIONS.map((emoji) => (
                      <motion.button
                        key={emoji}
                        className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-2xl", userReaction === emoji ? "bg-violet-500/30" : "hover:bg-white/10")}
                        onClick={() => handleReaction(emoji)}
                        whileHover={{ scale: 1.3 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reaction summary */}
            {Object.entries(reactionCounts)
              .filter(([, c]) => c > 0)
              .map(([emoji, count]) => (
                <span key={emoji} className="text-sm text-slate-400">
                  {emoji} {count}
                </span>
              ))}

            <div className="flex items-center gap-1.5 text-slate-400 ml-auto">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{comments.length} bình luận</span>
            </div>
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          className="glass rounded-3xl p-5 flex flex-col"
          style={{ maxHeight: "80vh" }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Post info */}
          <div className="mb-4 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                {post.user?.avatar_url ? (
                  <img src={post.user.avatar_url} alt={post.user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full gradient-bg flex items-center justify-center text-white font-bold">
                    {post.user?.name?.[0] || "?"}
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-white">{post.user?.name || "Ẩn danh"}</p>
                <p className="text-xs text-slate-500">{formatFullDate(post.created_at)}</p>
              </div>
            </div>
            {post.caption && <p className="text-slate-300 text-sm">{post.caption}</p>}
            {post.album && (
              <div className="mt-2">
                <span className="badge badge-pending text-xs">📁 {post.album.title}</span>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                Chưa có bình luận nào.<br />Hãy là người đầu tiên! 💬
              </div>
            ) : (
              comments.map((comment, i) => (
                <motion.div
                  key={comment.id}
                  className="group flex gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    {comment.user?.avatar_url ? (
                      <img src={comment.user.avatar_url} alt={comment.user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full gradient-bg flex items-center justify-center text-white text-xs font-bold">
                        {comment.user?.name?.[0] || "?"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="glass rounded-2xl rounded-tl-none px-3 py-2">
                      <p className="text-xs font-semibold text-violet-400 mb-0.5">{comment.user?.name}</p>
                      <p className="text-sm text-slate-200">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-600">{formatRelative(comment.created_at)}</span>
                      {(user?.id === comment.user_id || isAdmin()) && (
                        <button
                          className="text-xs text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Comment input */}
          <div className="flex gap-2 border-t border-white/5 pt-4">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-bg flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.[0] || "?"}
                </div>
              )}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                ref={commentInputRef}
                type="text"
                className="input py-2 text-sm"
                placeholder="Viết bình luận..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }}
              />
              <motion.button
                className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                onClick={handleSendComment}
                disabled={!newComment.trim() || isSending}
                whileHover={newComment.trim() ? { scale: 1.05 } : {}}
                whileTap={newComment.trim() ? { scale: 0.95 } : {}}
              >
                <Send className="w-4 h-4 text-white" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
