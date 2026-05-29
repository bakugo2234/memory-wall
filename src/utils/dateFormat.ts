import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

export function formatDate(dateString: string): string {
  const date = parseISO(dateString);
  if (isToday(date)) return "Hôm nay";
  if (isYesterday(date)) return "Hôm qua";
  return format(date, "dd/MM/yyyy", { locale: vi });
}

export function formatRelative(dateString: string): string {
  return formatDistanceToNow(parseISO(dateString), {
    addSuffix: true,
    locale: vi,
  });
}

export function formatMonthYear(dateString: string): string {
  return format(parseISO(dateString), "MMMM yyyy", { locale: vi });
}

export function formatFullDate(dateString: string): string {
  return format(parseISO(dateString), "EEEE, dd MMMM yyyy", { locale: vi });
}

export function isSameDayDifferentYear(dateString: string): boolean {
  const date = parseISO(dateString);
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() < now.getFullYear()
  );
}

export function getYearsAgo(dateString: string): number {
  const date = parseISO(dateString);
  return new Date().getFullYear() - date.getFullYear();
}

export function groupPostsByMonth<T extends { created_at: string }>(
  posts: T[]
): { label: string; date: string; posts: T[] }[] {
  const groups: Record<string, T[]> = {};

  posts.forEach((post) => {
    const key = format(parseISO(post.created_at), "yyyy-MM");
    if (!groups[key]) groups[key] = [];
    groups[key].push(post);
  });

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, posts]) => ({
      label: formatMonthYear(posts[0].created_at),
      date: key,
      posts,
    }));
}
