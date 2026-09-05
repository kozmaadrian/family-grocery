<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import BottomSheet from './BottomSheet.vue';
import { useDataStore } from '@/stores/data';
import {
  areasForStore,
  createProduct,
  deleteProduct,
  placement,
  removePlacement,
  restore,
  setPlacement,
  updateProduct,
} from '@/lib/domain';
import { showToast } from '@/lib/toast';

const props = defineProps<{ open: boolean; productId: string | null }>();
const emit = defineEmits<{ 'update:open': [value: boolean]; created: [id: string] }>();

const data = useDataStore();

const isNew = computed(() => props.productId === null);
const product = computed(() =>
  props.productId ? data.get('products', props.productId) : undefined,
);

const form = reactive({ name: '', qty: '', note: '' });
const hydrating = ref(false);

watch(
  () => [props.open, props.productId] as const,
  async ([open]) => {
    if (!open) return;
    hydrating.value = true;
    const p = product.value;
    form.name = p?.name ?? '';
    form.qty = p?.default_qty ?? '';
    form.note = p?.note ?? '';
    await nextTick();
    hydrating.value = false;
  },
  { immediate: true },
);

// Autosave edits to an existing product.
let saveTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => ({ ...form }),
  (f) => {
    if (isNew.value || !props.productId || hydrating.value) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      void updateProduct(props.productId!, {
        name: f.name.trim() || 'Untitled',
        default_qty: f.qty.trim() || null,
        note: f.note.trim() || null,
      });
    }, 400);
  },
);

const stores = computed(() => data.active('stores').sort((a, b) => a.name.localeCompare(b.name)));

function placedArea(storeId: string): string | null | undefined {
  if (!props.productId) return undefined;
  const p = placement(props.productId, storeId);
  return p && !p.deleted ? p.area_id : undefined;
}
const isPlaced = (storeId: string) => placedArea(storeId) !== undefined;

async function toggleStore(storeId: string) {
  if (!props.productId) return;
  if (isPlaced(storeId)) await removePlacement(props.productId, storeId);
  else await setPlacement(props.productId, storeId, null);
}

async function pickArea(storeId: string, areaId: string) {
  if (!props.productId) return;
  await setPlacement(props.productId, storeId, areaId || null);
}

const busy = ref(false);
async function add() {
  if (busy.value || form.name.trim().length === 0) return;
  busy.value = true;
  try {
    const id = await createProduct({
      name: form.name,
      default_qty: form.qty,
      note: form.note,
    });
    emit('created', id);
    emit('update:open', false);
  } finally {
    busy.value = false;
  }
}

async function remove() {
  if (!props.productId) return;
  const name = product.value?.name ?? 'Product';
  emit('update:open', false);
  const point = await deleteProduct(props.productId);
  showToast(`Deleted ${name}`, {
    action: { label: 'Undo', run: () => restore(point) },
  });
}
</script>

<template>
  <BottomSheet
    :open="open"
    :title="isNew ? 'New product' : 'Edit product'"
    @update:open="emit('update:open', $event)"
  >
    <div class="field">
      <label class="field__label">Name</label>
      <input
        v-model="form.name"
        class="field__input"
        placeholder="e.g. Oat milk"
        enterkeyhint="done"
        @keydown.enter="isNew && add()"
      />
    </div>

    <div class="field field--split">
      <div>
        <label class="field__label">Quantity</label>
        <input v-model="form.qty" class="field__input" placeholder="1" />
      </div>
      <div>
        <label class="field__label">Note</label>
        <input v-model="form.note" class="field__input" placeholder="the big one" />
      </div>
    </div>

    <template v-if="isNew">
      <button class="primary" :disabled="busy || form.name.trim().length === 0" @click="add">
        Add product
      </button>
    </template>

    <template v-else>
      <section class="buy">
        <h3 class="buy__label">Buy at</h3>
        <p v-if="stores.length === 0" class="buy__empty">
          No stores yet — add one from the Stores tab.
        </p>
        <div v-for="s in stores" :key="s.id" class="buy__store">
          <label class="buy__row">
            <input type="checkbox" :checked="isPlaced(s.id)" @change="toggleStore(s.id)" />
            <span class="buy__name">{{ s.name }}</span>
          </label>
          <select
            v-if="isPlaced(s.id)"
            class="buy__area"
            :value="placedArea(s.id) ?? ''"
            @change="pickArea(s.id, ($event.target as HTMLSelectElement).value)"
          >
            <option value="">Unsorted</option>
            <option v-for="a in areasForStore(s.id)" :key="a.id" :value="a.id">
              {{ a.name }}
            </option>
          </select>
        </div>
      </section>

      <button class="danger" @click="remove">Delete product</button>
    </template>
  </BottomSheet>
</template>

<style scoped>
.field {
  margin-bottom: var(--s-4);
}
.field--split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-3);
}
.field__label {
  display: block;
  margin-bottom: var(--s-1);
  font-size: var(--t-caption);
  font-weight: 600;
  color: var(--c-text-dim);
}
.field__input {
  width: 100%;
  padding: var(--s-3);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  background: var(--c-surface);
}
.field__input:focus {
  outline: none;
  border-color: var(--c-accent);
}
.primary {
  width: 100%;
  padding: var(--s-4);
  border: none;
  border-radius: var(--r-md);
  background: var(--c-accent);
  color: var(--c-accent-contrast);
  font-weight: 700;
}
.primary:disabled {
  opacity: 0.45;
}
.buy {
  margin: var(--s-2) 0 var(--s-4);
}
.buy__label {
  margin: 0 0 var(--s-2);
  font-size: var(--t-caption);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--c-text-faint);
}
.buy__empty {
  color: var(--c-text-dim);
  font-size: var(--t-body-sm);
}
.buy__store {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  padding: var(--s-2) 0;
}
.buy__row {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  flex: 1;
  min-height: 40px;
}
.buy__row input {
  width: 20px;
  height: 20px;
  accent-color: var(--c-accent);
}
.buy__area {
  padding: var(--s-2) var(--s-3);
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
  background: var(--c-surface);
  max-width: 45%;
}
.danger {
  width: 100%;
  margin-top: var(--s-2);
  padding: var(--s-3);
  border: none;
  border-radius: var(--r-md);
  background: var(--c-danger-soft);
  color: var(--c-danger);
  font-weight: 600;
}
</style>
