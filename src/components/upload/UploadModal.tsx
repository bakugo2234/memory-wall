"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, ImageIcon, Film, Tag, BookOpen, Loader2, CheckCircle2 } from "lucide-react";
import { useUIStore, useAuthStore } from "@/store";
import { createClient } from "@/lib/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Album } from "@/types";

export function UploadModal() {
  const { isUploadModalOpen, closeUploadModal } = useUIStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [caption, setCaption] = useState("");
  const [albumId, setAlbumId] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "saving" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch albums for dropdown
  const { data: albums } = useQuery({
    queryKey: ["albums-list"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("albums")
        .select("id, title")
        .order("created_at", { ascending: false });
      return (data as Album[]) || [];
    },
    enabled: isUploadModalOpen,
  });

  const reset = () => {
    setFile(null);
    setPreview(null);
    setCaption("");
    setAlbumId("");
    setUploadState("idle");
    setProgress(0);
    setIsDragging(false);
  };

  const handleClose = () => {
    if (uploadState === "uploading" || uploadState === "saving") return;
    reset();
    closeUploadModal();
  };

  const processFile = useCallback((f: File) => {
    const isVideo = f.type.startsWith("video/");
    const isImage = f.type.startsWith("image/");
    if (!isVideo && !isImage) {
      toast.error("Chỉ hỗ trợ ảnh và video");
      return;
    }
    setFile(f);
    setMediaType(isVideo ? "video" : "image");
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, [processFile]);

  const handleSubmit = async () => {
    if (!file || !user) return;

    try {
      setUploadState("uploading");

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 5, 85));
      }, 200);

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });

      clearInterval(progressInterval);
      setProgress(95);

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || "Upload thất bại");
      }

      const uploadData = await uploadRes.json();

      setUploadState("saving");

      // Save to Supabase
      const supabase = createClient();
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        caption: caption.trim() || null,
        media_url: uploadData.secure_url,
        media_type: mediaType,
        thumbnail_url: uploadData.thumbnail_url || null,
        width: uploadData.width || null,
        height: uploadData.height || null,
        duration: uploadData.duration || null,
        album_id: albumId || null,
        status: "pending",
      });

      if (error) throw error;

      setProgress(100);
      setUploadState("done");

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["pending-count"] });

      toast.success("🎉 Đã gửi! Bài đang chờ admin duyệt");

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error: unknown) {
      setUploadState("idle");
      setProgress(0);
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  if (!isUploadModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={handleClose}>
        <motion.div
          className="w-full max-w-lg glass-strong rounded-3xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
                <Upload className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Đăng kỷ niệm</h2>
                <p className="text-xs text-slate-500">Admin sẽ duyệt trước khi hiển thị</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors" disabled={uploadState === "uploading" || uploadState === "saving"}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Drop zone */}
            {!preview ? (
              <div
                className={cn("dropzone h-48 p-6", isDragging && "dragover")}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileInput} />
                <motion.div animate={{ y: isDragging ? -5 : 0 }}>
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <ImageIcon className="w-8 h-8 text-violet-400" />
                    <Film className="w-8 h-8 text-pink-400" />
                  </div>
                  <p className="text-white font-semibold text-center mb-1">
                    {isDragging ? "Thả file vào đây!" : "Kéo thả hoặc nhấn để chọn"}
                  </p>
                  <p className="text-slate-500 text-sm text-center">
                    Ảnh (JPG, PNG, GIF) hoặc Video (MP4, WebM)
                  </p>
                  <p className="text-slate-600 text-xs text-center mt-1">
                    Ảnh tối đa 10MB · Video tối đa 100MB
                  </p>
                </motion.div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black">
                {mediaType === "image" ? (
                  <img src={preview} alt="Preview" className="w-full max-h-64 object-contain" />
                ) : (
                  <video src={preview} controls className="w-full max-h-64" />
                )}
                <button
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  onClick={() => { setFile(null); setPreview(null); }}
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2">
                  <span className={cn("badge", mediaType === "image" ? "badge-approved" : "badge-pending")}>
                    {mediaType === "image" ? <ImageIcon className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                    {mediaType === "image" ? "Ảnh" : "Video"}
                  </span>
                </div>
              </div>
            )}

            {/* Caption */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Chú thích (tùy chọn)
              </label>
              <textarea
                className="textarea h-24"
                placeholder="Chia sẻ về kỷ niệm này..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-slate-600 text-right mt-1">{caption.length}/500</p>
            </div>

            {/* Album */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Thêm vào album (tùy chọn)
              </label>
              <select
                className="input"
                value={albumId}
                onChange={(e) => setAlbumId(e.target.value)}
              >
                <option value="">Không chọn album</option>
                {albums?.map((album) => (
                  <option key={album.id} value={album.id}>{album.title}</option>
                ))}
              </select>
            </div>

            {/* Progress */}
            {uploadState !== "idle" && uploadState !== "done" && (
              <div>
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>{uploadState === "uploading" ? "Đang tải lên..." : "Đang lưu..."}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full gradient-bg"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* Done state */}
            {uploadState === "done" && (
              <motion.div
                className="flex items-center justify-center gap-3 py-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CheckCircle2 className="w-8 h-8 text-green-400" />
                <div>
                  <p className="font-semibold text-white">Đã gửi thành công!</p>
                  <p className="text-sm text-slate-400">Bài đang chờ admin duyệt</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/5 flex gap-3">
            <button className="btn-ghost flex-1" onClick={handleClose} disabled={uploadState === "uploading" || uploadState === "saving"}>
              Hủy
            </button>
            <motion.button
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              onClick={handleSubmit}
              disabled={!file || uploadState !== "idle"}
              whileHover={file && uploadState === "idle" ? { scale: 1.02 } : {}}
              whileTap={file && uploadState === "idle" ? { scale: 0.98 } : {}}
              style={{ opacity: !file || uploadState !== "idle" ? 0.5 : 1 }}
            >
              {uploadState === "uploading" || uploadState === "saving" ? (
                <>
                  <Loader2 className="w-4 h-4 relative z-10 animate-spin" />
                  <span className="relative z-10">Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Gửi bài đăng</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
