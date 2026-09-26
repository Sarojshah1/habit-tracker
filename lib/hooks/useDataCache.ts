"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Global in-memory cache shared across all components
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const listeners = new Map<string, Set<() => void>>();

export function getCachedValue<T = any>(key: string): T | undefined {
  const entry = memoryCache.get(key);
  return entry ? entry.data : undefined;
}

export function setCachedValue<T = any>(key: string, data: T): void {
  memoryCache.set(key, { data, timestamp: Date.now() });
  notifyListeners(key);
}

export function clearCache(keyPrefix?: string): void {
  if (keyPrefix) {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(keyPrefix)) {
        memoryCache.delete(key);
        notifyListeners(key);
      }
    }
  } else {
    memoryCache.clear();
  }
}

function notifyListeners(key: string) {
  const set = listeners.get(key);
  if (set) {
    set.forEach((fn) => fn());
  }
}

export interface UseDataCacheOptions<T> {
  initialData?: T;
  revalidateOnFocus?: boolean;
  ttlMs?: number; // Cache TTL in ms (default 30 seconds before considered stale)
}

/**
 * High-performance Stale-While-Revalidate data hook.
 * Returns cached data immediately if available (0ms latency),
 * then revalidates in the background.
 */
export function useDataCache<T = any>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: UseDataCacheOptions<T> = {}
) {
  const { initialData, ttlMs = 30000 } = options;

  const getSnapshot = useCallback(() => {
    if (!key) return initialData;
    const entry = memoryCache.get(key);
    return entry ? entry.data : initialData;
  }, [key, initialData]);

  const [data, setData] = useState<T | undefined>(getSnapshot);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!key) return false;
    return !memoryCache.has(key);
  });
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const revalidate = useCallback(
    async (silent = true) => {
      if (!key) return;
      if (!silent) setIsLoading(true);
      setIsRevalidating(true);
      setError(null);

      try {
        const freshData = await fetcherRef.current();
        setCachedValue(key, freshData);
        setData(freshData);
      } catch (err) {
        console.error(`Error fetching ${key}:`, err);
        setError(err);
      } finally {
        setIsLoading(false);
        setIsRevalidating(false);
      }
    },
    [key]
  );

  // Optimistic mutation function
  const mutate = useCallback(
    (updater: T | ((prev: T | undefined) => T), shouldRevalidate = false) => {
      if (!key) return;
      const current = memoryCache.get(key)?.data ?? data;
      const nextData = typeof updater === "function" ? (updater as any)(current) : updater;
      setCachedValue(key, nextData);
      setData(nextData);

      if (shouldRevalidate) {
        revalidate(true);
      }
    },
    [key, data, revalidate]
  );

  // Subscribe to cache updates from other components
  useEffect(() => {
    if (!key) return;

    if (!listeners.has(key)) {
      listeners.set(key, new Set());
    }
    const updateFromCache = () => {
      const entry = memoryCache.get(key);
      if (entry) {
        setData(entry.data);
      }
    };
    listeners.get(key)!.add(updateFromCache);

    return () => {
      listeners.get(key)?.delete(updateFromCache);
    };
  }, [key]);

  // Initial fetch / revalidation
  useEffect(() => {
    if (!key) return;

    const entry = memoryCache.get(key);
    const isStale = !entry || Date.now() - entry.timestamp > ttlMs;

    if (entry) {
      setData(entry.data);
      setIsLoading(false);
      if (isStale) {
        revalidate(true);
      }
    } else {
      revalidate(false);
    }
  }, [key, ttlMs, revalidate]);

  return {
    data,
    isLoading,
    isRevalidating,
    error,
    mutate,
    revalidate,
  };
}
