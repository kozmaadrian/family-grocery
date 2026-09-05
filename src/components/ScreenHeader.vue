<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<template>
  <header class="hdr">
    <h1 class="hdr__title">{{ title }}</h1>
    <div class="hdr__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.hdr {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  padding: calc(var(--safe-t) + var(--s-2)) var(--s-4) var(--s-2);
  min-height: calc(var(--header-h) + var(--safe-t));
  background: color-mix(in srgb, var(--c-bg) 88%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--c-border);
}
.hdr__title {
  margin: 0;
  font-size: var(--t-screen);
  font-weight: 700;
  letter-spacing: -0.02em;
}
.hdr__actions {
  display: flex;
  align-items: center;
  gap: var(--s-2);
}
</style>
