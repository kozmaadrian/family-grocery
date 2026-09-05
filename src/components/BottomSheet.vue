<script setup lang="ts">
import { ref } from 'vue';
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
} from 'reka-ui';

defineProps<{
  open: boolean;
  title?: string;
  /** hide the default close (X) button */
  hideClose?: boolean;
}>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();

const dragY = ref(0);
const dragging = ref(false);
let startY = 0;

function onTouchStart(e: TouchEvent) {
  // Only start a drag from the handle / header area.
  startY = e.touches[0].clientY;
  dragging.value = true;
}
function onTouchMove(e: TouchEvent) {
  if (!dragging.value) return;
  const dy = e.touches[0].clientY - startY;
  dragY.value = Math.max(0, dy);
}
function onTouchEnd() {
  dragging.value = false;
  if (dragY.value > 110) emit('update:open', false);
  dragY.value = 0;
}
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="sheet__overlay" />
      <DialogContent
        class="sheet"
        :style="{
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragging ? 'none' : undefined,
        }"
      >
        <div
          class="sheet__grip"
          @touchstart.passive="onTouchStart"
          @touchmove.passive="onTouchMove"
          @touchend="onTouchEnd"
        >
          <span class="sheet__handle" />
        </div>

        <header v-if="title || !hideClose" class="sheet__head">
          <DialogTitle v-if="title" class="sheet__title">{{ title }}</DialogTitle>
          <span v-else />
          <DialogClose v-if="!hideClose" class="sheet__close" aria-label="Close">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </DialogClose>
        </header>

        <div class="sheet__body">
          <slot />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.sheet__overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: var(--c-scrim);
  animation: fade var(--dur) var(--ease);
}
.sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 41;
  display: flex;
  flex-direction: column;
  max-height: 92dvh;
  background: var(--c-surface);
  border-radius: var(--r-lg) var(--r-lg) 0 0;
  box-shadow: var(--e-2);
  padding-bottom: var(--safe-b);
  animation: slide-up var(--dur) var(--ease);
}
.sheet__grip {
  display: flex;
  justify-content: center;
  padding: var(--s-2) 0 var(--s-1);
  touch-action: none;
  cursor: grab;
}
.sheet__handle {
  width: 40px;
  height: 4px;
  border-radius: var(--r-full);
  background: var(--c-border);
}
.sheet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  padding: var(--s-1) var(--s-4) var(--s-3);
}
.sheet__title {
  margin: 0;
  font-size: var(--t-title);
  font-weight: 700;
}
.sheet__close {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--r-full);
  background: var(--c-surface-2);
  color: var(--c-text-dim);
}
.sheet__body {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 var(--s-4) var(--s-4);
}

@keyframes fade {
  from {
    opacity: 0;
  }
}
@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
}
</style>
