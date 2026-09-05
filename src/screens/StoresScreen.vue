<script setup lang="ts">
import ScreenHeader from '@/components/ScreenHeader.vue';
</script>

<template>
  <div class="screen">
    <ScreenHeader title="Stores" />
    <div class="screen__body">
      <p class="placeholder">Stores &amp; areas — coming in Phase 4.</p>
    </div>
  </div>
</template>

<style scoped>
.screen {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
.screen__body {
  padding: var(--s-4);
}
.placeholder {
  color: var(--c-text-dim);
}
</style>
