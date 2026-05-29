export type UserRole = "admin" | "member";
export type PostStatus = "pending" | "approved" | "rejected";
export type MediaType = "image" | "video";
export type ReactionEmoji = "❤️" | "😂" | "😮" | "😢" | "👍" | "🎉";
export type NotificationType = "comment" | "reaction" | "approved" | "rejected";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  caption: string | null;
  media_url: string;
  media_type: MediaType;
  thumbnail_url: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  album_id: string | null;
  status: PostStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reject_reason: string | null;
  created_at: string;
  // Joins
  user?: User;
  album?: Album;
  reactions?: Reaction[];
  comments?: Comment[];
  _count?: {
    reactions: number;
    comments: number;
  };
}

export interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  event_date: string | null;
  created_by: string;
  created_at: string;
  // Joins
  creator?: User;
  posts?: Post[];
  _count?: {
    posts: number;
  };
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  emoji: ReactionEmoji;
  created_at: string;
  user?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: NotificationType;
  post_id: string | null;
  read_at: string | null;
  created_at: string;
  actor?: User;
  post?: Post;
}
