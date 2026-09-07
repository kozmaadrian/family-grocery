<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { ShopItem } from '@/lib/shopping';
import CheckCircle from './CheckCircle.vue';
import QtyChip from './QtyChip.vue';
import NoteLabel from './NoteLabel.vue';

const props = defineProps<{
  item: ShopItem;
  checked: boolean;
  showStores?: boolean;
  /** play a collapse-out animation when checked (bought items are hidden) */
  collapseOnCheck?: boolean;
}>();
const emit = defineEmits<{ toggle: []; remove: []; open: [] }>();

// per-trip value wins, else the product's default
const qty = computed(() => props.item.need.qty || props.item.product.default_qty || '');
const note = computed(() => props.item.need.note || props.item.product.note || '');
const hasChips = computed(() => Boolean(props.showStores && props.item.storeNames.length));

// check-off animation: fill + strike, then (optionally) collapse away
type Phase = 'idle' | 'checking' | 'leaving';
const phase = ref<Phase>('idle');
const shownChecked = computed(() => props.checked || phase.value !== 'idle');

watch(
  () => props.item.need.id,
  () => {
    phase.value = 'idle';
  },
);

function onCheck() {
  if (props.checked || phase.value !== 'idle') {
    emit('toggle'); // un-checking is immediate
    return;
  }
  phase.value = 'checking';
  setTimeout(() => {
    if (props.collapseOnCheck) {
      phase.value = 'leaving';
      setTimeout(() => emit('toggle'), 240);
    } else {
      emit('toggle');
      phase.value = 'idle';
    }
  }, 220);
}

const dx = ref(0);
const swiping = ref(false);
let startX = 0;
let startY = 0;
let decided: 'h' | 'v' | null = null;

function onStart(e: TouchEvent) {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  decided = null;
  swiping.value = true;
}
function onMove(e: TouchEvent) {
  if (!swiping.value) return;
  const mx = e.touches[0].clientX - startX;
  const my = e.touches[0].clientY - startY;
  if (!decided) {
    if (Math.abs(mx) > 8 || Math.abs(my) > 8) decided = Math.abs(mx) > Math.abs(my) ? 'h' : 'v';
  }
  if (decided === 'h') dx.value = Math.min(0, mx);
}
function onEnd() {
  swiping.value = false;
  if (dx.value < -96) emit('remove');
  dx.value = 0;
  decided = null;
}

let pressTimer: ReturnType<typeof setTimeout> | null = null;
function onPressStart() {
  pressTimer = setTimeout(() => emit('open'), 500);
}
function onPressEnd() {
  if (pressTimer) clearTimeout(pressTimer);
}
</script>

<template>
  <div class="wrap" @touchstart.passive="onStart" @touchmove.passive="onMove" @touchend="onEnd">
    <div v-if="dx < 0" class="wrap__bg"><span>Remove</span></div>
    <div
      class="row"
      :class="{ 'is-leaving': phase === 'leaving' }"
      :style="{ transform: dx ? `translateX(${dx}px)` : undefined, transition: swiping ? 'none' : undefined }"
      @touchstart.passive="onPressStart"
      @touchend="onPressEnd"
      @touchmove.passive="onPressEnd"
    >
      <CheckCircle
        :checked="shownChecked"
        :label="checked ? `Move ${item.product.name} back to list` : `Put ${item.product.name} in cart`"
        @toggle="onCheck"
      />

      <button class="row__body" @click="emit('open')">
        <span class="row__main">
          <span class="row__name" :class="{ 'is-done': shownChecked }">{{ item.product.name }}</span>
          <span v-if="hasChips" class="row__sub">
            <span v-for="s in item.storeNames" :key="s" class="chip">{{ s }}</span>
          </span>
        </span>
        <span v-if="qty || note" class="row__aside">
          <QtyChip v-if="qty" :qty="qty" :dim="shownChecked" />
          <NoteLabel v-if="note" :text="note" />
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  position: relative;
  overflow: hidden;
}
.wrap__bg {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: var(--s-4);
  background: var(--c-danger);
  color: #fff;
  font-weight: 700;
  font-size: var(--t-body-sm);
}
.row {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  min-height: 56px;
  background: var(--c-bg);
  border-bottom: 1px solid var(--c-border);
  overflow: hidden;
  transition:
    min-height 0.24s var(--ease),
    padding 0.24s var(--ease),
    opacity 0.24s var(--ease),
    transform 0.24s var(--ease);
}
.row.is-leaving {
  min-height: 0;
  height: 0;
  padding-top: 0;
  padding-bottom: 0;
  opacity: 0;
  transform: translateX(-16px);
  pointer-events: none;
}
.row__body {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--s-3);
  border: none;
  background: none;
  text-align: left;
  padding: 0;
}
.row__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.row__name {
  min-width: 0;
  font-size: var(--t-body);
  overflow: hidden;
  text-overflow: ellipsis;
}
.row__name.is-done {
  color: var(--c-text-faint);
  text-decoration: line-through;
}
.row__sub {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: var(--t-caption);
  color: var(--c-text-dim);
}
.row__aside {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  max-width: 46%;
}
.chip {
  background: var(--c-surface-2);
  padding: 1px 7px;
  border-radius: var(--r-full);
}
</style>
