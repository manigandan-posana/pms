import { useMemo } from 'react';

/**
 * useGlobalFilter - simple reusable filtering hook
 * @param items - array of items to filter
 * @param query - search query string
 * @param keys - optional list of keys to restrict searchable fields
 */
export default function useGlobalFilter<T extends object = Record<string, unknown>>(
  items: T[],
  query: string,
  keys?: Array<keyof T>
) {
  return useMemo(() => {
    if (!query || !String(query).trim()) return items;
    const q = String(query).toLowerCase();

    return items.filter((item) => {
      if (keys && keys.length > 0) {
        return keys.some((k) => {
          const v = (item as any)[k];
          return v != null && String(v).toLowerCase().includes(q);
        });
      }

      return Object.values(item).some((v) => v != null && String(v).toLowerCase().includes(q));
    });
  }, [items, query, keys]);
}
