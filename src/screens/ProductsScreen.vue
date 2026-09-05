<script setup lang="ts">
import { computed, ref } from 'vue';
import ScreenHeader from '@/components/ScreenHeader.vue';
import ProductSheet from '@/components/ProductSheet.vue';
import { useDataStore } from '@/stores/data';
import { needId } from '@/lib/ids';
import { setNeeded, storesForProduct } from '@/lib/domain';

const data = useDataStore();
const query = ref('');
const sheetOpen = ref(false);
const editingId = ref<string | null>(null);

const products = computed(() => {
  const q = query.value.trim().toLowerCase();
  return data
    .active('products')
    .filter((p) => !q || p.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));
});

const storeName = (id: string) => data.get('stores', id)?.name ?? '';

function isNeeded(productId: string): boolean {
  const n = data.get('needs', needId(productId));
  return Boolean(n && !n.deleted);
}

function openNew() {
  editingId.value = null;
  sheetOpen.value = true;
}
function openEdit(id: string) {
  editingId.value = id;
  sheetOpen.value = true;
}
</script>

<template>
  <div class="screen">
    <ScreenHeader title="Products">
      <template #actions>
        <button class="add" aria-label="New product" @click="openNew">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
          </svg>
        </button>
      </template>
    </ScreenHeader>

    <div class="search">
      <input v-model="query" class="search__input" type="search" placeholder="Search products" />
    </div>

    <div class="list">
      <p v-if="products.length === 0" class="empty">
        {{ query ? 'No matches.' : 'No products yet. Tap + to add one.' }}
      </p>

      <div v-for="p in products" :key="p.id" class="row">
        <button class="row__main" @click="openEdit(p.id)">
          <span class="row__name">{{ p.name }}</span>
          <span class="row__meta">
            <template v-for="(sid, i) in storesForProduct(p.id)" :key="sid">
              <span class="chip">{{ storeName(sid) }}</span>
              <span v-if="i < storesForProduct(p.id).length - 1" class="chip-gap" />
            </template>
            <span v-if="p.default_qty" class="row__qty">{{ p.default_qty }}</span>
          </span>
        </button>
        <label class="row__need" :class="{ 'is-on': isNeeded(p.id) }">
          <input
            type="checkbox"
            :checked="isNeeded(p.id)"
            @change="setNeeded(p.id, ($event.target as HTMLInputElement).checked)"
          />
          <span>Need</span>
        </label>
      </div>
    </div>

    <ProductSheet
      v-model:open="sheetOpen"
      :product-id="editingId"
      @created="openEdit($event)"
    />
  </div>
</template>

<style scoped>
.screen {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
.add {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--r-full);
  background: var(--c-accent);
  color: var(--c-accent-contrast);
}
.add:active {
  transform: scale(0.94);
}
.search {
  padding: 0 var(--s-4) var(--s-3);
  position: sticky;
  top: calc(var(--header-h) + var(--safe-t));
  background: var(--c-bg);
  z-index: 5;
}
.search__input {
  width: 100%;
  padding: var(--s-3);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  background: var(--c-surface);
}
.search__input:focus {
  outline: none;
  border-color: var(--c-accent);
}
.list {
  padding: 0 var(--s-4) var(--s-6);
}
.empty {
  color: var(--c-text-dim);
  padding: var(--s-5) 0;
  text-align: center;
}
.row {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  border-bottom: 1px solid var(--c-border);
}
.row__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--s-3) 0;
  border: none;
  background: none;
  text-align: left;
}
.row__name {
  font-size: var(--t-body);
}
.row__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.chip {
  font-size: var(--t-caption);
  color: var(--c-text-dim);
  background: var(--c-surface-2);
  padding: 1px 8px;
  border-radius: var(--r-full);
}
.row__qty {
  font-size: var(--t-caption);
  color: var(--c-text-faint);
}
.row__need {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--s-2);
  color: var(--c-text-faint);
  font-size: 11px;
  font-weight: 600;
}
.row__need.is-on {
  color: var(--c-accent);
}
.row__need input {
  width: 22px;
  height: 22px;
  accent-color: var(--c-accent);
}
</style>
