<script setup lang="ts">
defineProps<{ text: string }>();
</script>

<template>
  <span class="note">{{ text }}</span>
</template>

<style scoped>
.note {
  flex: none;
  min-width: 0;
  max-width: 100%;
  font-size: var(--t-caption);
  color: var(--c-text-dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
