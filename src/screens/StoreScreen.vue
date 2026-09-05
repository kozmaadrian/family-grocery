<script setup lang="ts">
import { useRoute } from 'vue-router';
import ScreenHeader from '@/components/ScreenHeader.vue';

const route = useRoute();
</script>

<template>
  <div class="screen">
    <ScreenHeader title="Store" />
    <div class="screen__body">
      <p class="placeholder">Store {{ route.params.id }} detail — coming in Phase 4.</p>
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
