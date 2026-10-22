import 'server-only';
import { parseCursor } from '@/features/operations/services';
export const publicPageSize = 48;
export type BrowseQuery = { q?: string | string[]; category?: string | string[]; sub?: string | string[]; cursor?: string | string[]; page?: string | string[] };
export const singleQuery = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] ?? '' : value ?? '';
export function publicCursor(value: string | string[] | undefined) {
  const raw = singleQuery(value); if (!raw) return null;
  return parseCursor(raw);
}
export function publicCursorFilter(cursor: NonNullable<ReturnType<typeof publicCursor>>) {
  return `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`;
}
export function publicWindow<T extends { id: string; created_at: string }>(rows: T[]) {
  const items = rows.slice(0, publicPageSize), last = items.at(-1);
  return { items, nextCursor: rows.length > publicPageSize && last ? Buffer.from(JSON.stringify({ created_at: last.created_at, id: last.id })).toString('base64url') : null };
}
export function browseHref(path: '/catalog' | '/gallery', filters: { q?: string; category?: string; sub?: string; page?: string | number }, cursor?: string | null) {
  const query = new URLSearchParams(); if (filters.q) query.set('q', filters.q); if (filters.category) query.set('category', filters.category); if (filters.sub) query.set('sub', filters.sub); if (filters.page && Number(filters.page) > 1) query.set('page', String(filters.page)); if (cursor) query.set('cursor', cursor);
  return path + (query.size ? '?' + query.toString() : '');
}
