"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Loader2, CalendarDays } from "lucide-react";
import { useUIStore, useAuthStore } from "@/store";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function CreateAlbumModal() {
  const { isCreateAlbumModalOpen, closeCreateAlbumModal } = useUIStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const reset = () => {
    setTitle("");
    setDescription("");
    setEventDate("");
    setIsLoading(false);
  };

  const handleClose = () => {
    if (isLoading) return;
    reset();
    closeCreateAlbumModal();
  };

  const handleSubmit = async () => {
    if (!title.trim() || !user) return;
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("albums").insert({
        title: title.trim(),
        description: description.trim() || null,
        event_date: eventDate || null,
        created_by: user.id,
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["albums"] });
      queryClient.invalidateQueries({ queryKey: ["albums-list"] });
      toast.success("🎉 Tạo album thành công!");
      handleClose();
    } catch {
      toast.error("Không thể tạo album");
      setIsLoading(false);
    }
  };

  if (!isCreateAlbumModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={handleClose}>
        <motion.div
          className="w-full max-w-md glass-strong rounded-3xl overflow-hidden shadow-2xl"
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
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">Tạo Album Mới</h2>
            </div>
            <button onClick={handleClose} disabled={isLoading} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Tên album *</label>
              <input
                type="text"
                className="input"
                placeholder="VD: Tiệc tất niên 2024, Dã ngoại tháng 5..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Mô tả (tùy chọn)</label>
              <textarea
                className="textarea h-20"
                placeholder="Mô tả về sự kiện này..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Ngày sự kiện (tùy chọn)
              </label>
              <input
                type="date"
                className="input"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
          </div>

          <div className="p-6 border-t border-white/5 flex gap-3">
            <button className="btn-ghost flex-1" onClick={handleClose} disabled={isLoading}>Hủy</button>
            <motion.button
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              onClick={handleSubmit}
              disabled={!title.trim() || isLoading}
              style={{ opacity: !title.trim() ? 0.5 : 1 }}
              whileHover={title.trim() ? { scale: 1.02 } : {}}
              whileTap={title.trim() ? { scale: 0.98 } : {}}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 relative z-10 animate-spin" /><span className="relative z-10">Đang tạo...</span></>
              ) : (
                <><BookOpen className="w-4 h-4 relative z-10" /><span className="relative z-10">Tạo album</span></>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
