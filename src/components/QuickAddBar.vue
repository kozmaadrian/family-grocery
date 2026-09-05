<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useDataStore } from '@/stores/data';
import { useKeyboardInset } from '@/lib/useKeyboardInset';
import { needId } from '@/lib/ids';
import { createProduct, setNeeded, setPlacement } from '@/lib/domain';

const props = defineProps<{ storeId: string }>();

const data = useDataStore();
const kb = useKeyboardInset();
const text = ref('');
const focused = ref(false);

const suggestions = computed(() => {
  const q = text.value.trim().toLowerCase();
  if (!q) return [];
  return data
    .active('products')
    .filter((p) => {
      const need = data.get('needs', needId(p.id));
      const alreadyNeeded = need && !need.deleted && need.status !== 'in_cart';
      return !alreadyNeeded && p.name.toLowerCase().includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 6);
});

async function addProduct(productId: string) {
  await setNeeded(productId, true);
  if (props.storeId) await setPlacement(productId, props.storeId, null);
  text.value = '';
}

onMounted(() => document.documentElement.style.setProperty('--qa-h', '58px'));
onUnmounted(() => document.documentElement.style.removeProperty('--qa-h'));

async function submit() {
  const name = text.value.trim();
  if (!name) return;
  const existing = data
    .active('products')
    .find((p) => p.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    await addProduct(existing.id);
    return;
  }
  const id = await createProduct({ name });
  await addProduct(id);
}
</script>

<template>
  <div class="qa" :style="{ bottom: `calc(var(--tabbar-h) + var(--safe-b) + ${kb}px)` }">
    <ul v-if="focused && suggestions.length" class="qa__sug">
      <li v-for="p in suggestions" :key="p.id">
        <button @mousedown.prevent="addProduct(p.id)">
          <span>{{ p.name }}</span>
          <span class="qa__add">Add</span>
        </button>
      </li>
    </ul>
    <form class="qa__bar" @submit.prevent="submit">
      <input
        v-model="text"
        class="qa__input"
        type="text"
        placeholder="Add an item…"
        enterkeyhint="done"
        autocapitalize="sentences"
        autocomplete="off"
        @focus="focused = true"
        @blur="focused = false"
      />
      <button type="submit" class="qa__go" :disabled="!text.trim()" aria-label="Add">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" />
        </svg>
      </button>
    </form>
  </div>
</template>

<style scoped>
.qa {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 25;
  padding: var(--s-2) var(--s-3);
  background: var(--c-bg);
  border-top: 1px solid var(--c-border);
  transition: bottom 0.12s var(--ease);
}
.qa__sug {
  list-style: none;
  margin: 0 0 var(--s-2);
  padding: var(--s-1);
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  box-shadow: var(--e-2);
  max-height: 40vh;
  overflow-y: auto;
}
.qa__sug button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--s-3);
  border: none;
  background: none;
  text-align: left;
  border-radius: var(--r-sm);
}
.qa__sug button:active {
  background: var(--c-surface-2);
}
.qa__add {
  font-size: var(--t-caption);
  font-weight: 700;
  color: var(--c-accent);
}
.qa__bar {
  display: flex;
  align-items: center;
  gap: var(--s-2);
}
.qa__input {
  flex: 1;
  min-width: 0;
  padding: var(--s-3);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  background: var(--c-surface);
}
.qa__input:focus {
  outline: none;
  border-color: var(--c-accent);
}
.qa__go {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: none;
  border: none;
  border-radius: var(--r-md);
  background: var(--c-accent);
  color: var(--c-accent-contrast);
}
.qa__go:disabled {
  opacity: 0.4;
}
</style>
