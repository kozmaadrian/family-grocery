<script setup lang="ts">
import { computed, ref } from 'vue';
import ScreenHeader from '@/components/ScreenHeader.vue';
import FabButton from '@/components/FabButton.vue';
import CheckCircle from '@/components/CheckCircle.vue';
import ProductSheet from '@/components/ProductSheet.vue';
import StorePickerSheet from '@/components/StorePickerSheet.vue';
import DraggableAisle from '@/components/DraggableAisle.vue';
import { useDataStore } from '@/stores/data';
import { useShopStore } from '@/stores/shop';
import { useArrangeView } from '@/lib/arrange';
import { needId } from '@/lib/ids';
import { reorderPlacements, setNeeded, storesForProduct } from '@/lib/domain';

const data = useDataStore();
const shop = useShopStore();

const query = ref('');
const sheetOpen = ref(false);
const editingId = ref<string | null>(null);
const pickerOpen = ref(false);

const storeId = computed(() =>
  shop.storeId && data.get('stores', shop.storeId) ? shop.storeId : '',
);
const storeLabel = computed(() =>
  storeId.value ? (data.get('stores', storeId.value)?.name ?? 'Store') : 'All products',
);
const arranging = computed(() => storeId.value !== '' && !query.value.trim());
const aisles = useArrangeView(storeId);

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
        <button class="switch" @click="pickerOpen = true">
          <span>{{ storeLabel }}</span>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </template>
    </ScreenHeader>

    <div class="search">
      <input v-model="query" class="search__input" type="search" placeholder="Search products" />
    </div>

    <!-- store selected: arrange that store's products by aisle -->
    <div v-if="arranging" class="list">
      <p class="hint">
        Tick what you need, and drag items into the order you pass them at
        {{ storeLabel }}.
      </p>
      <p v-if="aisles.length === 0" class="empty">
        No products assigned to {{ storeLabel }} yet.<br />
        Open a product and turn on “Buy at {{ storeLabel }}”.
      </p>
      <section v-for="g in aisles" :key="g.key" class="group">
        <div class="group__head">{{ g.title }}</div>
        <DraggableAisle
          :items="g.items"
          @reorder="reorderPlacements(storeId, g.key === 'unsorted' ? null : g.key, $event)"
          @toggle="(id, needed) => setNeeded(id, needed)"
          @open="openEdit($event)"
        />
      </section>
    </div>

    <!-- default: flat catalog -->
    <div v-else class="list">
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
          <span v-if="storesForProduct(p.id).length" class="row__meta">
            <span v-for="sid in storesForProduct(p.id)" :key="sid" class="chip">
              {{ storeName(sid) }}
            </span>
          </span>
        </button>

        <div v-if="p.default_qty || p.note" class="row__aside">
          <span v-if="p.default_qty" class="row__qty">{{ p.default_qty }}</span>
          <span v-if="p.note" class="row__note">{{ p.note }}</span>
        </div>
      </div>
    </div>

    <FabButton label="New product" @click="openNew" />

    <StorePickerSheet
      v-model:open="pickerOpen"
      :selected="storeId"
      @pick="shop.selectStore($event)"
    />
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
.switch {
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 55vw;
  padding: 6px 8px 6px 12px;
  border: none;
  border-radius: var(--r-full);
  background: var(--c-accent-soft);
  color: var(--c-accent);
  font-weight: 700;
  font-size: var(--t-body-sm);
}
.switch span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
.hint {
  color: var(--c-text-dim);
  font-size: var(--t-body-sm);
  margin: var(--s-2) 0 var(--s-3);
}
.empty {
  color: var(--c-text-dim);
  padding: var(--s-5) 0;
  text-align: center;
}
.group__head {
  padding: var(--s-3) 0 var(--s-1);
  font-size: var(--t-caption);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--c-text-faint);
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
.row__aside {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  max-width: 42%;
  text-align: right;
}
.row__qty {
  font-weight: 700;
  font-size: var(--t-body-sm);
  color: var(--c-text);
}
.row__note {
  font-size: var(--t-caption);
  color: var(--c-text-dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
</style>
