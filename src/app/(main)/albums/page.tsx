"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Plus, CalendarDays, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Album } from "@/types";
import { useUIStore } from "@/store";
import { formatDate } from "@/utils/dateFormat";

export default function AlbumsPage() {
  const { openCreateAlbumModal } = useUIStore();

  const { data: albums, isLoading } = useQuery({
    queryKey: ["albums"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("albums")
        .select(`*, creator:users(name, avatar_url)`)
        .order("created_at", { ascending: false });

      // Get post counts and first post for cover
      const albumsWithData = await Promise.all(
        (data as Album[]).map(async (album) => {
          const { count } = await supabase
            .from("posts")
            .select("*", { count: "exact", head: true })
            .eq("album_id", album.id)
            .eq("status", "approved");

          const { data: firstPost } = await supabase
            .from("posts")
            .select("media_url, thumbnail_url, media_type")
            .eq("album_id", album.id)
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...album,
            _count: { posts: count || 0 },
            coverPost: firstPost,
          };
        })
      );

      return albumsWithData;
    },
  });

  return (
    <div>
      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">📁 Albums</h1>
          <p className="text-slate-400">Kỷ niệm được nhóm theo sự kiện</p>
        </div>
        <motion.button
          className="btn-primary flex items-center gap-2"
          onClick={openCreateAlbumModal}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Tạo album</span>
        </motion.button>
      </motion.div>

      {/* Albums grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      ) : albums?.length === 0 ? (
        <motion.div className="text-center py-24" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="w-20 h-20 rounded-3xl gradient-bg flex items-center justify-center mx-auto mb-6 opacity-60">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Chưa có album nào</h3>
          <p className="text-slate-400 mb-8 max-w-sm mx-auto">
            Tạo album đầu tiên để nhóm kỷ niệm theo sự kiện!
          </p>
          <button className="btn-primary" onClick={openCreateAlbumModal}>
            <span className="relative z-10">📁 Tạo album đầu tiên</span>
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums?.map((album, i) => (
            <AlbumCard key={album.id} album={album} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function AlbumCard({ album, index }: { album: Album & { coverPost?: { media_url: string; thumbnail_url?: string; media_type: string } | null; _count?: { posts: number } }; index: number }) {
  const coverImage = album.cover_url || album.coverPost?.thumbnail_url || album.coverPost?.media_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
    >
      <Link href={`/albums/${album.id}`}>
        <div className="post-card group h-full">
          {/* Cover */}
          <div className="relative h-48 bg-black/30 overflow-hidden rounded-t-2xl">
            {coverImage ? (
              <Image src={coverImage} alt={album.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.15))" }}>
                <BookOpen className="w-16 h-16 text-violet-400/40" />
              </div>
            )}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }} />
            <div className="absolute bottom-3 left-3">
              <span className="badge" style={{ background: "rgba(0,0,0,0.5)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
                <ImageIcon className="w-3 h-3" />
                {album._count?.posts || 0} ảnh
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="p-4">
            <h3 className="font-bold text-white text-lg mb-1 truncate">{album.title}</h3>
            {album.description && (
              <p className="text-slate-400 text-sm line-clamp-2 mb-3">{album.description}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {album.event_date && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {formatDate(album.event_date)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
