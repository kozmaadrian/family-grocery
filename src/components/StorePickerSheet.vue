<script setup lang="ts">
import { computed } from 'vue';
import BottomSheet from './BottomSheet.vue';
import { useDataStore } from '@/stores/data';
import { placementsForStore } from '@/lib/domain';

const props = defineProps<{ open: boolean; selected: string }>();
const emit = defineEmits<{ 'update:open': [value: boolean]; pick: [id: string] }>();

const data = useDataStore();

const neededProductIds = computed(
  () => new Set(data.active('needs').filter((n) => n.status === 'needed').map((n) => n.product_id)),
);

const stores = computed(() =>
  data
    .active('stores')
    .map((s) => ({
      id: s.id,
      name: s.name,
      covers: placementsForStore(s.id).filter((p) => neededProductIds.value.has(p.product_id)).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name)),
);

function pick(id: string) {
  emit('pick', id);
  emit('update:open', false);
}

void props;
</script>

<template>
  <BottomSheet :open="open" title="Shop at" @update:open="emit('update:open', $event)">
    <button class="opt" :class="{ 'is-on': selected === '' }" @click="pick('')">
      <span>Any store</span>
      <span class="opt__meta">all items</span>
    </button>
    <button
      v-for="s in stores"
      :key="s.id"
      class="opt"
      :class="{ 'is-on': selected === s.id }"
      @click="pick(s.id)"
    >
      <span>{{ s.name }}</span>
      <span class="opt__meta">{{ s.covers }} to buy</span>
    </button>
    <p v-if="stores.length === 0" class="empty">Add stores from the Stores tab.</p>
  </BottomSheet>
</template>

<style scoped>
.opt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--s-4) var(--s-3);
  border: none;
  border-bottom: 1px solid var(--c-border);
  background: none;
  font-size: var(--t-body);
  text-align: left;
}
.opt.is-on {
  color: var(--c-accent);
  font-weight: 700;
}
.opt__meta {
  font-size: var(--t-caption);
  color: var(--c-text-dim);
}
.empty {
  color: var(--c-text-dim);
  padding: var(--s-4) 0;
}
</style>
