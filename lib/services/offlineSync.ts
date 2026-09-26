"use client";

import { useEffect, useState } from "react";

export interface OfflineAction {
  id: string;
  type: "toggle_habit" | "log_water" | "log_expense" | "generic";
  endpoint: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  payload: any;
  timestamp: number;
  description: string;
  retryCount?: number;
}

const STORAGE_KEY = "habittrack_offline_actions_v1";

/**
 * Get pending offline actions from localStorage
 */
export function getOfflineQueue(): OfflineAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading offline queue:", err);
    return [];
  }
}

/**
 * Save pending actions to localStorage
 */
function saveOfflineQueue(queue: OfflineAction[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    // Dispatch custom event so all open tabs/components can update count
    window.dispatchEvent(new CustomEvent("habittrack_queue_updated", { detail: queue.length }));
  } catch (err) {
    console.error("Error saving offline queue:", err);
  }
}

/**
 * Enqueue a mutation to execute when back online
 */
export function enqueueOfflineAction(action: Omit<OfflineAction, "id" | "timestamp">): OfflineAction {
  const fullAction: OfflineAction = {
    ...action,
    id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: Date.now(),
    retryCount: 0,
  };

  const queue = getOfflineQueue();
  queue.push(fullAction);
  saveOfflineQueue(queue);

  return fullAction;
}

/**
 * Remove an action by id
 */
export function removeOfflineAction(id: string) {
  const queue = getOfflineQueue();
  const filtered = queue.filter((a) => a.id !== id);
  saveOfflineQueue(filtered);
}

/**
 * Synchronize all pending actions sequentially
 */
export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { synced: 0, failed: 0 };
  }

  let syncedCount = 0;
  let failedCount = 0;
  const remainingQueue: OfflineAction[] = [];

  for (const action of queue) {
    try {
      const response = await fetch(action.endpoint, {
        method: action.method,
        headers: { "Content-Type": "application/json" },
        body: action.payload ? JSON.stringify(action.payload) : undefined,
      });

      if (response.ok) {
        syncedCount++;
      } else if (response.status >= 400 && response.status < 500) {
        // Bad request / validation error, drop it to avoid infinite failure loop
        console.warn(`Offline action ${action.id} failed with ${response.status}: dropping.`);
        failedCount++;
      } else {
        // Server 5xx error, retain for next retry
        action.retryCount = (action.retryCount || 0) + 1;
        remainingQueue.push(action);
        failedCount++;
      }
    } catch (err) {
      // Still offline or network dropped mid-sync
      console.warn(`Network error replaying action ${action.id}:`, err);
      action.retryCount = (action.retryCount || 0) + 1;
      remainingQueue.push(action);
      failedCount++;
    }
  }

  saveOfflineQueue(remainingQueue);

  if (syncedCount > 0) {
    window.dispatchEvent(
      new CustomEvent("habittrack_sync_completed", { detail: { synced: syncedCount } })
    );
  }

  return { synced: syncedCount, failed: failedCount };
}

/**
 * React hook to reactively track online state, pending queue, and trigger manual sync
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== "undefined" ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setPendingCount(getOfflineQueue().length);

    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);
      try {
        const res = await syncOfflineQueue();
        if (res.synced > 0) {
          setLastSyncResult(`Synced ${res.synced} offline ${res.synced === 1 ? "action" : "actions"}`);
          setTimeout(() => setLastSyncResult(null), 5000);
        }
      } finally {
        setIsSyncing(false);
        setPendingCount(getOfflineQueue().length);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueChange = () => {
      setPendingCount(getOfflineQueue().length);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("habittrack_queue_updated", handleQueueChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("habittrack_queue_updated", handleQueueChange);
    };
  }, []);

  const triggerSync = async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await syncOfflineQueue();
      if (res.synced > 0) {
        setLastSyncResult(`Synced ${res.synced} items`);
        setTimeout(() => setLastSyncResult(null), 4000);
      }
    } finally {
      setIsSyncing(false);
      setPendingCount(getOfflineQueue().length);
    }
  };

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncResult,
    triggerSync,
  };
}
