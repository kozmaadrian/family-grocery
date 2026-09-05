<script setup lang="ts">
import { ref, watch } from 'vue';
import { dragAndDrop } from '@formkit/drag-and-drop/vue';
import type { ShopItem } from '@/lib/shopping';
import ShopRow from './ShopRow.vue';

const props = defineProps<{ items: ShopItem[]; showStores?: boolean }>();
const emit = defineEmits<{
  reorder: [productIds: string[]];
  toggle: [productId: string];
  remove: [productId: string, name: string];
  open: [productId: string];
}>();

const parent = ref<HTMLElement>();
const list = ref<ShopItem[]>([...props.items]);

dragAndDrop<ShopItem>({
  parent,
  values: list,
  longPress: true,
  dragHandle: '.row__grip',
});

// reconcile external changes (sync, add/remove) without clobbering a drag
watch(
  () => props.items,
  (fresh) => {
    const a = fresh.map((x) => x.need.id).join(',');
    const b = list.value.map((x) => x.need.id).join(',');
    if (a !== b) list.value = [...fresh];
  },
);

// persist a user reorder
watch(list, (l) => {
  const dragged = l.map((x) => x.need.id).join(',');
  const persisted = props.items.map((x) => x.need.id).join(',');
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
    <ShopRow
      v-for="it in list"
      :key="it.need.id"
      :item="it"
      :checked="false"
      :show-stores="showStores"
      draggable-row
      @toggle="emit('toggle', it.product.id)"
      @remove="emit('remove', it.product.id, it.product.name)"
      @open="emit('open', it.product.id)"
    />
  </div>
</template>
