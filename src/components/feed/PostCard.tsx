"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Play, MessageCircle, Heart, MoreVertical, Trash2, Volume2, VolumeX } from "lucide-react";
import { Post, ReactionEmoji } from "@/types";
import { formatRelative } from "@/utils/dateFormat";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const REACTIONS: ReactionEmoji[] = ["❤️", "😂", "😮", "😢", "👍", "🎉"];

interface PostCardProps {
  post: Post;
  onDeleted?: () => void;
}

export function PostCard({ post, onDeleted }: PostCardProps) {
  const { user, isAdmin } = useAuthStore();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showReactions, setShowReactions] = useState(false);
  const [userReaction, setUserReaction] = useState<ReactionEmoji | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [commentCount, setCommentCount] = useState(post._count?.comments || 0);
  const [showMenu, setShowMenu] = useState(false);

  // Calculate reaction data
  useEffect(() => {
    if (post.reactions) {
      const counts: Record<string, number> = {};
      post.reactions.forEach((r) => {
        counts[r.emoji] = (counts[r.emoji] || 0) + 1;
        if (r.user_id === user?.id) setUserReaction(r.emoji as ReactionEmoji);
      });
      setReactionCounts(counts);
    }
    if (post._count?.comments) setCommentCount(post._count.comments);
  }, [post, user]);

  // Video autoplay on hover
  useEffect(() => {
    if (post.media_type === "video" && videoRef.current) {
      if (isHovered) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovered, post.media_type]);

  const handleReaction = async (emoji: ReactionEmoji) => {
    if (!user) return;
    const supabase = createClient();
    setShowReactions(false);

    if (userReaction === emoji) {
      // Remove reaction
      await supabase.from("reactions").delete()
        .eq("post_id", post.id).eq("user_id", user.id);
      setReactionCounts((prev) => ({ ...prev, [emoji]: Math.max((prev[emoji] || 0) - 1, 0) }));
      setUserReaction(null);
    } else {
      // Upsert reaction
      if (userReaction) {
        setReactionCounts((prev) => ({ ...prev, [userReaction]: Math.max((prev[userReaction] || 0) - 1, 0) }));
      }
      await supabase.from("reactions").upsert({
        post_id: post.id,
        user_id: user.id,
        emoji,
      }, { onConflict: "post_id,user_id" });
      setReactionCounts((prev) => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
      setUserReaction(emoji);
    }
  };

  const handleDelete = async () => {
    const supabase = createClient();
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) {
      toast.error("Không thể xóa bài");
    } else {
      toast.success("Đã xóa bài đăng");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      onDeleted?.();
    }
    setShowMenu(false);
  };

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);
  const topReactions = Object.entries(reactionCounts)
    .filter(([, c]) => c > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([emoji]) => emoji);

  const canDelete = user?.id === post.user_id || isAdmin();

  return (
    <motion.div
      className="post-card masonry-item"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowReactions(false); setShowMenu(false); }}
    >
      {/* Media */}
      <div className="relative overflow-hidden rounded-t-2xl bg-black/50"
        style={{ aspectRatio: post.width && post.height ? `${post.width}/${post.height}` : "4/3", maxHeight: "400px" }}>
        {post.media_type === "image" ? (
          <Link href={`/post/${post.id}`}>
            <Image
              src={post.media_url}
              alt={post.caption || "Memory"}
              fill
              className="object-cover transition-transform duration-500"
              style={{ transform: isHovered ? "scale(1.03)" : "scale(1)" }}
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          </Link>
        ) : (
          <div className="relative w-full h-full">
            {post.thumbnail_url && !isHovered ? (
              <Link href={`/post/${post.id}`}>
                <Image src={post.thumbnail_url} alt="Video thumbnail" fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center">
                    <Play className="w-7 h-7 text-white ml-1" />
                  </div>
                </div>
              </Link>
            ) : (
              <>
                <video
                  ref={videoRef}
                  src={post.media_url}
                  className="w-full h-full object-cover"
                  muted={isMuted}
                  loop
                  playsInline
                />
                <button
                  className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors z-10"
                  onClick={(e) => { e.preventDefault(); setIsMuted(!isMuted); }}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </>
            )}
          </div>
        )}

        {/* Hover overlay */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Author */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
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
              <p className="text-sm font-medium text-white">{post.user?.name || "Ẩn danh"}</p>
              <p className="text-xs text-slate-500">{formatRelative(post.created_at)}</p>
            </div>
          </div>

          {/* Menu */}
          {canDelete && (
            <div className="relative">
              <button className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                onClick={() => setShowMenu(!showMenu)}>
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <motion.div
                  className="absolute right-0 top-full mt-1 w-40 glass-strong rounded-xl p-1 shadow-2xl z-20"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa bài
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm text-slate-300 mb-3 line-clamp-2">{post.caption}</p>
        )}

        {/* Reactions & Comments */}
        <div className="flex items-center justify-between">
          {/* Reaction bar */}
          <div className="relative flex items-center gap-2">
            <div className="relative">
              <button
                className={cn("reaction-btn", userReaction && "active")}
                onClick={() => setShowReactions(!showReactions)}
              >
                {userReaction || <Heart className="w-4 h-4" />}
                {totalReactions > 0 && (
                  <span className="text-xs">{totalReactions}</span>
                )}
              </button>

              {/* Reaction picker */}
              <AnimatePresence>
                {showReactions && (
                  <motion.div
                    className="absolute bottom-full left-0 mb-2 flex gap-1 glass-strong rounded-2xl p-2 shadow-2xl z-30"
                    initial={{ opacity: 0, scale: 0.8, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 5 }}
                  >
                    {REACTIONS.map((emoji) => (
                      <motion.button
                        key={emoji}
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-all",
                          userReaction === emoji ? "bg-violet-500/30 scale-110" : "hover:bg-white/10"
                        )}
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

            {topReactions.length > 0 && (
              <span className="text-xs text-slate-500">{topReactions.join("")}</span>
            )}
          </div>

          {/* Comments */}
          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-1.5 text-slate-400 hover:text-violet-400 transition-colors text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            {commentCount > 0 && <span>{commentCount}</span>}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
