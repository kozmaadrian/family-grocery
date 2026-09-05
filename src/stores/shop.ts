import { defineStore } from 'pinia';

const KEY = 'grocery:store';

export const useShopStore = defineStore('shop', {
  state: () => ({
    // '' means "Any store"
    storeId: (() => {
      try {
        return localStorage.getItem(KEY) ?? '';
      } catch {
        return '';
      }
    })(),
    collapsed: new Set<string>(),
  }),
  actions: {
    selectStore(id: string) {
      this.storeId = id;
      try {
        localStorage.setItem(KEY, id);
      } catch {
        /* ignore */
      }
    },
    toggleGroup(key: string) {
      if (this.collapsed.has(key)) this.collapsed.delete(key);
      else this.collapsed.add(key);
    },
  },
});
