<script setup lang="ts">
defineProps<{ qty: string; dim?: boolean }>();
</script>

<template>
  <span class="qty" :class="{ 'is-dim': dim }">×&nbsp;{{ qty }}</span>
</template>

<style scoped>
.qty {
  flex: none;
  color: var(--c-accent);
  font-size: var(--t-body);
  font-weight: 700;
  white-space: nowrap;
}
.qty.is-dim {
  color: var(--c-text-faint);
}
</style>
