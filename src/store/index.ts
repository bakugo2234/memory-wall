"use client";

import { create } from "zustand";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  isAdmin: () => get().user?.role === "admin",
}));

interface UIState {
  isUploadModalOpen: boolean;
  isCreateAlbumModalOpen: boolean;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  openCreateAlbumModal: () => void;
  closeCreateAlbumModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isUploadModalOpen: false,
  isCreateAlbumModalOpen: false,
  openUploadModal: () => set({ isUploadModalOpen: true }),
  closeUploadModal: () => set({ isUploadModalOpen: false }),
  openCreateAlbumModal: () => set({ isCreateAlbumModalOpen: true }),
  closeCreateAlbumModal: () => set({ isCreateAlbumModalOpen: false }),
}));
