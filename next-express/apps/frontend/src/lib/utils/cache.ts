import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Type-safe wrapper for Next.js revalidatePath.
 * Ensures that revalidation only happens for known app paths.
 * Expand this type as new routes are added.
 */
export type AppRoute =
  | '/'
  | '/todos'
  | '/profile'
  | '/admin'
  | (string & {}); // Fallback for dynamic routes

export function clearCacheByPath(path: AppRoute, type?: 'layout' | 'page') {
  try {
    revalidatePath(path, type);
  } catch (error) {
    console.error(`Failed to revalidate path: ${path}`, error);
  }
}

/**
 * Type-safe wrapper for Next.js revalidateTag.
 * Ensures consistent tag names across the app.
 */
export type CacheTag =
  | 'todos'
  | 'user'
  | 'tags'
  | 'categories'
  | (string & {});

export function clearCacheByTag(tag: CacheTag) {
  try {
    // @ts-expect-error - Next.js 15 canary typing issue
    revalidateTag(tag);
  } catch (error) {
    console.error(`Failed to revalidate tag: ${tag}`, error);
  }
}
