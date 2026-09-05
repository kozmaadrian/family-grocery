<script setup lang="ts">
import { computed, ref } from 'vue';
import ScreenHeader from '@/components/ScreenHeader.vue';
import FabButton from '@/components/FabButton.vue';
import CheckCircle from '@/components/CheckCircle.vue';
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
    <ScreenHeader title="Products" />

    <div class="search">
      <input v-model="query" class="search__input" type="search" placeholder="Search products" />
    </div>

    <div class="list">
      <p v-if="products.length === 0" class="empty">
        {{ query ? 'No matches.' : 'No products yet. Tap + to add one.' }}
      </p>

      <div v-for="p in products" :key="p.id" class="row">
        <CheckCircle
          :checked="isNeeded(p.id)"
          :label="isNeeded(p.id) ? `Remove ${p.name} from the list` : `Add ${p.name} to the list`"
          @toggle="setNeeded(p.id, !isNeeded(p.id))"
        />
        <button class="row__main" @click="openEdit(p.id)">
          <span class="row__name" :class="{ 'is-on': isNeeded(p.id) }">{{ p.name }}</span>
          <span
            v-if="p.default_qty || p.note || storesForProduct(p.id).length"
            class="row__meta"
          >
            <span v-if="p.default_qty" class="row__qty">{{ p.default_qty }}</span>
            <span v-if="p.note" class="row__note">{{ p.note }}</span>
            <span v-for="sid in storesForProduct(p.id)" :key="sid" class="chip">
              {{ storeName(sid) }}
            </span>
          </span>
        </button>
      </div>
    </div>

    <FabButton label="New product" @click="openNew" />

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
  padding: 0 var(--s-4);
  padding-bottom: calc(var(--tabbar-h) + var(--safe-b) + 88px);
}
.empty {
  color: var(--c-text-dim);
  padding: var(--s-5) 0;
  text-align: center;
}
.row {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-3) 0;
  min-height: 56px;
  border-bottom: 1px solid var(--c-border);
}
.row__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 0;
  border: none;
  background: none;
  text-align: left;
}
.row__name {
  font-size: var(--t-body);
}
.row__name.is-on {
  color: var(--c-accent);
  font-weight: 600;
}
.row__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: var(--t-caption);
  color: var(--c-text-dim);
}
.chip {
  color: var(--c-text-dim);
  background: var(--c-surface-2);
  padding: 1px 8px;
  border-radius: var(--r-full);
}
.row__qty,
.row__note {
  color: var(--c-text-faint);
}
</style>
