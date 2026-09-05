<script setup lang="ts">
import { ref, watch } from 'vue';
import { dragAndDrop } from '@formkit/drag-and-drop/vue';
import type { ArrangeItem } from '@/lib/arrange';
import CheckCircle from './CheckCircle.vue';

const props = defineProps<{ items: ArrangeItem[] }>();
const emit = defineEmits<{
  reorder: [productIds: string[]];
  toggle: [productId: string, needed: boolean];
  open: [productId: string];
}>();

const parent = ref<HTMLElement>();
const list = ref<ArrangeItem[]>([...props.items]);

dragAndDrop<ArrangeItem>({
  parent,
  values: list,
  longPress: true,
  dragHandle: '.arr__grip',
});

watch(
  () => props.items,
  (fresh) => {
    const a = fresh.map((x) => x.product.id).join(',');
    const b = list.value.map((x) => x.product.id).join(',');
    if (a !== b) list.value = [...fresh];
  },
);

watch(list, (l) => {
  const dragged = l.map((x) => x.product.id).join(',');
  const persisted = props.items.map((x) => x.product.id).join(',');
  if (dragged !== persisted && l.length === props.items.length) {
    emit(
      'reorder',
      l.map((x) => x.product.id),
    );
  }
});
</script>

<template>
  <div ref="parent">
    <div v-for="it in list" :key="it.product.id" class="arr">
      <CheckCircle
        :checked="it.needed"
        :label="it.needed ? `Remove ${it.product.name} from the list` : `Add ${it.product.name} to the list`"
        @toggle="emit('toggle', it.product.id, !it.needed)"
      />
      <button class="arr__body" @click="emit('open', it.product.id)">
        <span class="arr__name" :class="{ 'is-on': it.needed }">{{ it.product.name }}</span>
        <span v-if="it.product.note" class="arr__note">{{ it.product.note }}</span>
      </button>
      <span v-if="it.product.default_qty" class="arr__qty">{{ it.product.default_qty }}</span>
      <button class="arr__grip" aria-label="Reorder" @click.stop>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.arr {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  min-height: 56px;
  background: var(--c-bg);
  border-bottom: 1px solid var(--c-border);
}
.arr__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border: none;
  background: none;
  text-align: left;
  padding: 0;
}
.arr__name {
  font-size: var(--t-body);
}
.arr__name.is-on {
  color: var(--c-accent);
  font-weight: 600;
}
.arr__note {
  font-size: var(--t-caption);
  color: var(--c-text-dim);
}
.arr__qty {
  flex: none;
  font-weight: 700;
  font-size: var(--t-body-sm);
}
.arr__grip {
  flex: none;
  display: grid;
  place-items: center;
  width: 36px;
  height: 44px;
  border: none;
  background: none;
  color: var(--c-text-faint);
  cursor: grab;
  touch-action: none;
}
</style>
