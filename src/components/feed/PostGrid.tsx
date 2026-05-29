"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Post } from "@/types";
import { PostCard } from "./PostCard";
import { motion } from "framer-motion";
import { Camera, Loader2 } from "lucide-react";
import { useUIStore } from "@/store";

const PAGE_SIZE = 12;

async function fetchPosts({ pageParam = 0 }: { pageParam: number }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      user:users(*),
      reactions(*),
      album:albums(id, title)
    `)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

  if (error) throw error;

  // Count comments for each post
  const postsWithCounts = await Promise.all(
    (data as Post[]).map(async (post) => {
      const { count } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id);
      return { ...post, _count: { reactions: post.reactions?.length || 0, comments: count || 0 } };
    })
  );

  return {
    posts: postsWithCounts,
    nextPage: data.length === PAGE_SIZE ? pageParam + 1 : undefined,
  };
}

export function PostGrid() {
  const { openUploadModal } = useUIStore();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery({
      queryKey: ["posts"],
      queryFn: fetchPosts,
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    });

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const allPosts = data?.pages.flatMap((p) => p.posts) || [];

  if (isLoading) {
    const skeletonHeights = [240, 310, 280, 350, 220, 290, 330, 260];
    return (
      <div className="masonry">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="masonry-item">
            <div className="skeleton rounded-2xl" style={{ height: `${skeletonHeights[i]}px` }} />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">Không thể tải bài đăng</p>
        <button className="btn-ghost" onClick={() => window.location.reload()}>Thử lại</button>
      </div>
    );
  }

  if (allPosts.length === 0) {
    return (
      <motion.div
        className="text-center py-24"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-20 h-20 rounded-3xl gradient-bg flex items-center justify-center mx-auto mb-6 opacity-60">
          <Camera className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">Chưa có kỷ niệm nào</h3>
        <p className="text-slate-400 mb-8 max-w-sm mx-auto">
          Hãy là người đầu tiên chia sẻ một khoảnh khắc đáng nhớ với mọi người!
        </p>
        <button className="btn-primary" onClick={openUploadModal}>
          <span className="relative z-10">📸 Đăng kỷ niệm đầu tiên</span>
        </button>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="masonry">
        {allPosts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.5) }}
          >
            <PostCard post={post} />
          </motion.div>
        ))}
      </div>

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="flex justify-center py-8">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Đang tải thêm...</span>
          </div>
        )}
        {!hasNextPage && allPosts.length > 0 && (
          <p className="text-slate-600 text-sm">✨ Đã tải hết tất cả kỷ niệm</p>
        )}
      </div>
    </div>
  );
}
