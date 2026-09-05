import { defineStore } from 'pinia';

export type SyncState = 'idle' | 'syncing' | 'offline' | 'error';

export const useSyncStore = defineStore('sync', {
  state: () => ({
    status: 'idle' as SyncState,
    pendingCount: 0,
    lastSyncedAt: 0,
    lastError: '' as string,
  }),
  getters: {
    hasPending: (s) => s.pendingCount > 0,
  },
  actions: {
    setStatus(status: SyncState, error = '') {
      this.status = status;
      this.lastError = error;
      if (status === 'idle') this.lastSyncedAt = Date.now();
    },
    setPending(n: number) {
      this.pendingCount = n;
    },
  },
});
