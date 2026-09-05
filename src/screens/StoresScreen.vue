<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import ScreenHeader from '@/components/ScreenHeader.vue';
import PromptSheet from '@/components/PromptSheet.vue';
import { useDataStore } from '@/stores/data';
import { createStore } from '@/lib/domain';

const data = useDataStore();
const router = useRouter();
const addOpen = ref(false);

const stores = computed(() =>
  data.active('stores').sort((a, b) => a.name.localeCompare(b.name)),
);

const neededProductIds = computed(
  () => new Set(data.active('needs').map((n) => n.product_id)),
);

function areaCount(storeId: string): number {
  return data.active('areas').filter((a) => a.store_id === storeId).length;
}
function neededHere(storeId: string): number {
  return data
    .active('placements')
    .filter((p) => p.store_id === storeId && neededProductIds.value.has(p.product_id))
    .length;
}

async function add(name: string) {
  const id = await createStore(name);
  router.push(`/stores/${id}`);
}
</script>

<template>
  <div class="screen">
    <ScreenHeader title="Stores">
      <template #actions>
        <button class="add" aria-label="New store" @click="addOpen = true">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
          </svg>
        </button>
      </template>
    </ScreenHeader>

    <div class="list">
      <p v-if="stores.length === 0" class="empty">
        No stores yet. Add the shops you visit, then arrange their aisles.
      </p>

      <RouterLink v-for="s in stores" :key="s.id" :to="`/stores/${s.id}`" class="row">
        <span class="row__name">{{ s.name }}</span>
        <span class="row__meta">
          {{ areaCount(s.id) }} {{ areaCount(s.id) === 1 ? 'area' : 'areas' }}
          <span v-if="neededHere(s.id)" class="badge">{{ neededHere(s.id) }} to buy</span>
        </span>
        <svg class="row__chev" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </RouterLink>
    </div>

    <PromptSheet
      v-model:open="addOpen"
      title="New store"
      label="Store name"
      placeholder="e.g. Lidl"
      submit-label="Create"
      @submit="add"
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
.list {
  padding: var(--s-2) var(--s-4) var(--s-6);
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
  padding: var(--s-4) 0;
  border-bottom: 1px solid var(--c-border);
  text-decoration: none;
  color: var(--c-text);
}
.row__name {
  font-size: var(--t-body);
  font-weight: 600;
}
.row__meta {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--s-2);
  font-size: var(--t-caption);
  color: var(--c-text-dim);
}
.badge {
  background: var(--c-accent-soft);
  color: var(--c-accent);
  padding: 1px 8px;
  border-radius: var(--r-full);
  font-weight: 600;
}
.row__chev {
  color: var(--c-text-faint);
}
</style>
