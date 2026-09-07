<script setup lang="ts">
defineProps<{ qty: string; dim?: boolean }>();
</script>

<template>
  <span class="qty" :class="{ 'is-dim': dim }">×&nbsp;{{ qty }}</span>
</template>

<style scoped>
.qty {
  flex: none;
  padding: 2px 11px;
  border-radius: var(--r-full);
  background: var(--c-accent-soft);
  color: var(--c-accent);
  font-size: var(--t-body);
  font-weight: 800;
  white-space: nowrap;
}
.qty.is-dim {
  background: var(--c-surface-2);
  color: var(--c-text-faint);
}
</style>
