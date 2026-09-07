<script setup lang="ts">
import { ref } from 'vue';
import BottomSheet from './BottomSheet.vue';
import { importData, parseImport, type ImportSummary } from '@/lib/portable';
import { showToast } from '@/lib/toast';

defineProps<{ open: boolean }>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();

const text = ref('');
const busy = ref(false);
const result = ref<ImportSummary | null>(null);

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  text.value = await file.text();
}

async function run() {
  if (busy.value || !text.value.trim()) return;
  busy.value = true;
  result.value = null;
  try {
    const data = parseImport(text.value);
    if (!data.products?.length && !data.stores?.length) {
      showToast('Nothing recognised to import');
      return;
    }
    result.value = await importData(data);
    const s = result.value;
    const total =
      s.storesAdded + s.aislesAdded + s.productsAdded + s.productsUpdated + s.placementsAdded;
    showToast(total ? `Imported — ${s.productsAdded + s.productsUpdated} products` : 'No changes');
    text.value = '';
  } catch (err) {
    showToast(err instanceof Error ? err.message : 'Import failed');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <BottomSheet
    :open="open"
    title="Import"
    @update:open="
      (v) => {
        emit('update:open', v);
        if (!v) result = null;
      }
    "
  >
    <p class="hint">
      Paste JSON, or a plain list of product names (one per line, optionally
      <code>name, qty, note</code>). Existing stores and products are matched by
      name, not duplicated.
    </p>

    <details class="fmt">
      <summary>JSON format</summary>
      <pre>{
  "stores": [
    { "name": "Lidl", "aisles": ["Produce", "Dairy"] }
  ],
  "products": [
    { "name": "Milk", "qty": "2 L", "note": "semi-skimmed",
      "stores": ["Lidl: Dairy", "Costco"] }
  ]
}</pre>
    </details>

    <textarea
      v-model="text"
      class="ta"
      rows="7"
      placeholder="Paste here…"
      spellcheck="false"
    />

    <label class="file">
      <input type="file" accept=".json,.txt,.csv" @change="onFile" />
      Choose a file instead
    </label>

    <div v-if="result" class="res">
      <span v-if="result.storesAdded">+{{ result.storesAdded }} stores</span>
      <span v-if="result.aislesAdded">+{{ result.aislesAdded }} aisles</span>
      <span v-if="result.productsAdded">+{{ result.productsAdded }} products</span>
      <span v-if="result.productsUpdated">{{ result.productsUpdated }} updated</span>
      <span v-if="result.placementsAdded">+{{ result.placementsAdded }} placements</span>
      <p v-for="(e, i) in result.errors" :key="i" class="res__err">{{ e }}</p>
    </div>

    <button class="go" :disabled="busy || !text.trim()" @click="run">
      {{ busy ? 'Importing…' : 'Import' }}
    </button>
  </BottomSheet>
</template>

<style scoped>
.hint {
  margin: 0 0 var(--s-3);
  color: var(--c-text-dim);
  font-size: var(--t-body-sm);
  line-height: 1.5;
}
.hint code {
  background: var(--c-surface-2);
  padding: 0 4px;
  border-radius: var(--r-sm);
  font-size: 0.9em;
}
.fmt {
  margin-bottom: var(--s-3);
  font-size: var(--t-body-sm);
  color: var(--c-text-dim);
}
.fmt summary {
  cursor: pointer;
  font-weight: 600;
}
.fmt pre {
  margin: var(--s-2) 0 0;
  padding: var(--s-3);
  background: var(--c-surface-2);
  border-radius: var(--r-md);
  overflow-x: auto;
  font-size: var(--t-caption);
  line-height: 1.5;
}
.ta {
  width: 100%;
  padding: var(--s-3);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  background: var(--c-surface);
  font: inherit;
  font-size: var(--t-body-sm);
  resize: vertical;
}
.ta:focus {
  outline: none;
  border-color: var(--c-accent);
}
.file {
  display: block;
  margin: var(--s-3) 0;
  font-size: var(--t-body-sm);
  color: var(--c-accent);
  font-weight: 600;
}
.file input {
  display: block;
  margin-top: var(--s-1);
  font-weight: 400;
  color: var(--c-text-dim);
}
.res {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  margin-bottom: var(--s-3);
  font-size: var(--t-caption);
  font-weight: 600;
  color: var(--c-accent);
}
.res__err {
  flex-basis: 100%;
  margin: 0;
  color: var(--c-danger);
  font-weight: 400;
}
.go {
  width: 100%;
  padding: var(--s-4);
  border: none;
  border-radius: var(--r-md);
  background: var(--c-accent);
  color: var(--c-accent-contrast);
  font-weight: 700;
}
.go:disabled {
  opacity: 0.45;
}
</style>
