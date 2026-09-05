<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import BottomSheet from './BottomSheet.vue';
import { useDataStore } from '@/stores/data';
import { needId } from '@/lib/ids';
import { areasForStore, placement, setNeeded, setPlacement, updateNeed } from '@/lib/domain';
import { showToast } from '@/lib/toast';

const props = defineProps<{ open: boolean; productId: string | null; storeId: string }>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();

const data = useDataStore();

const product = computed(() =>
  props.productId ? data.get('products', props.productId) : undefined,
);
const need = computed(() =>
  props.productId ? data.get('needs', needId(props.productId)) : undefined,
);
const currentArea = computed(() => {
  if (!props.productId || !props.storeId) return undefined;
  return placement(props.productId, props.storeId)?.area_id ?? null;
});

const form = reactive({ qty: '', note: '' });
watch(
  () => [props.open, props.productId] as const,
  ([open]) => {
    if (!open) return;
    form.qty = need.value?.qty ?? '';
    form.note = need.value?.note ?? '';
  },
  { immediate: true },
);

let t: ReturnType<typeof setTimeout> | null = null;
watch(
  () => ({ ...form }),
  (f) => {
    if (!props.open || !props.productId) return;
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      void updateNeed(props.productId!, {
        qty: f.qty.trim() || null,
        note: f.note.trim() || null,
      });
    }, 350);
  },
);

const areas = computed(() => (props.storeId ? areasForStore(props.storeId) : []));

async function moveTo(areaId: string) {
  if (props.productId && props.storeId) await setPlacement(props.productId, props.storeId, areaId || null);
}

async function removeFromList() {
  if (!props.productId) return;
  const name = product.value?.name ?? 'Item';
  emit('update:open', false);
  await setNeeded(props.productId, false);
  showToast(`Removed ${name}`);
}
</script>

<template>
  <BottomSheet
    :open="open"
    :title="product?.name ?? 'Item'"
    @update:open="emit('update:open', $event)"
  >
    <div class="split">
      <div>
        <label class="lbl">Quantity</label>
        <input v-model="form.qty" class="inp" placeholder="1" />
      </div>
      <div>
        <label class="lbl">Note</label>
        <input v-model="form.note" class="inp" placeholder="the big one" />
      </div>
    </div>

    <template v-if="storeId && need">
      <label class="lbl">Aisle at this store</label>
      <select class="inp" :value="currentArea ?? ''" @change="moveTo(($event.target as HTMLSelectElement).value)">
        <option value="">Unsorted</option>
        <option v-for="a in areas" :key="a.id" :value="a.id">{{ a.name }}</option>
      </select>
    </template>

    <button class="danger" @click="removeFromList">Remove from list</button>
  </BottomSheet>
</template>

<style scoped>
.split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-3);
  margin-bottom: var(--s-4);
}
.lbl {
  display: block;
  margin-bottom: var(--s-1);
  font-size: var(--t-caption);
  font-weight: 600;
  color: var(--c-text-dim);
}
.inp {
  width: 100%;
  padding: var(--s-3);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  background: var(--c-surface);
  margin-bottom: var(--s-4);
}
.inp:focus {
  outline: none;
  border-color: var(--c-accent);
}
.danger {
  width: 100%;
  padding: var(--s-3);
  border: none;
  border-radius: var(--r-md);
  background: var(--c-danger-soft);
  color: var(--c-danger);
  font-weight: 600;
}
</style>
