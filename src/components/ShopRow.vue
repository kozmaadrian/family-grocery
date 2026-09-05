<script setup lang="ts">
import { ref } from 'vue';
import type { ShopItem } from '@/lib/shopping';

const props = defineProps<{
  item: ShopItem;
  checked: boolean;
  showStores?: boolean;
  draggableRow?: boolean;
}>();
const emit = defineEmits<{ toggle: []; remove: []; open: [] }>();

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

void props;
</script>

<template>
  <div class="wrap" @touchstart.passive="onStart" @touchmove.passive="onMove" @touchend="onEnd">
    <div v-if="dx < 0" class="wrap__bg"><span>Remove</span></div>
    <div
      class="row"
      :style="{ transform: dx ? `translateX(${dx}px)` : undefined, transition: swiping ? 'none' : undefined }"
      @touchstart.passive="onPressStart"
      @touchend="onPressEnd"
      @touchmove.passive="onPressEnd"
    >
      <button
        class="row__check"
        :class="{ 'is-on': checked }"
        :aria-pressed="checked"
        @click="emit('toggle')"
      >
        <svg v-if="checked" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M5 12l4 4L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <button class="row__body" @click="emit('open')">
        <span class="row__name" :class="{ 'is-done': checked }">{{ item.product.name }}</span>
        <span v-if="item.need.qty || item.need.note || (showStores && item.storeNames.length)" class="row__sub">
          <template v-if="item.need.qty">{{ item.need.qty }}</template>
          <template v-if="item.need.qty && item.need.note"> · </template>
          <template v-if="item.need.note">{{ item.need.note }}</template>
          <template v-if="showStores">
            <span v-for="s in item.storeNames" :key="s" class="chip">{{ s }}</span>
          </template>
        </span>
      </button>

      <button v-if="draggableRow" class="row__grip" aria-label="Reorder" @click.stop>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
        </svg>
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
}
.row__check {
  flex: none;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 2px solid var(--c-border);
  border-radius: var(--r-full);
  background: var(--c-surface);
  color: var(--c-accent-contrast);
  transition:
    background var(--dur) var(--ease),
    border-color var(--dur) var(--ease),
    transform var(--dur) var(--ease);
}
.row__check.is-on {
  background: var(--c-accent);
  border-color: var(--c-accent);
  animation: pop 0.25s var(--ease);
}
.row__body {
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
.row__name {
  font-size: var(--t-body);
}
.row__name.is-done {
  color: var(--c-text-faint);
  text-decoration: line-through;
}
.row__sub {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: var(--t-caption);
  color: var(--c-text-dim);
}
.row__grip {
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
.chip {
  background: var(--c-surface-2);
  padding: 1px 7px;
  border-radius: var(--r-full);
}
@keyframes pop {
  40% {
    transform: scale(1.18);
  }
}
</style>
