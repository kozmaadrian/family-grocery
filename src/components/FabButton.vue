<script setup lang="ts">
defineProps<{ label: string }>();
const emit = defineEmits<{ click: [] }>();
</script>

<template>
  <button class="fab" :aria-label="label" @click="emit('click')">
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" />
    </svg>
  </button>
</template>

<style scoped>
.fab {
  position: fixed;
  right: var(--s-4);
  bottom: calc(var(--tabbar-h) + var(--safe-b) + var(--s-4));
  z-index: 15;
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border: none;
  border-radius: var(--r-full);
  background: var(--c-accent);
  color: var(--c-accent-contrast);
  box-shadow: var(--e-2);
}
.fab:active {
  transform: scale(0.92);
}
</style>
