"use client";

import { motion } from "framer-motion";
import { PostGrid } from "@/components/feed/PostGrid";
import { Sparkles, Camera, Heart, Clock } from "lucide-react";

export default function FeedPage() {
  return (
    <div>
      {/* Hero section */}
      <motion.div
        className="relative rounded-3xl overflow-hidden mb-8 p-8 sm:p-12"
        style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(236,72,153,0.1) 100%)",
          border: "1px solid rgba(124,58,237,0.2)",
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-15 blur-3xl"
            style={{ background: "radial-gradient(circle, #ec4899, transparent)" }} />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-violet-400">Memory Wall</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Tường Kỷ Niệm 📸
          </h1>
          <p className="text-slate-400 text-lg mb-6">
            Nơi lưu giữ mọi khoảnh khắc đáng nhớ của chúng mình. Mỗi bức ảnh, mỗi video — một mảnh ký ức không thể quên.
          </p>

          <div className="flex flex-wrap gap-4">
            {[
              { icon: Camera, label: "Đăng ảnh & video" },
              { icon: Heart, label: "React & bình luận" },
              { icon: Clock, label: "Xem lại theo timeline" },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-2 text-sm text-slate-300"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <item.icon className="w-4 h-4 text-violet-400" />
                {item.label}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Feed grid */}
      <PostGrid />
    </div>
  );
}
