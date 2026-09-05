<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import TabBar from '@/components/TabBar.vue';
import { useAppStore } from '@/stores/app';

const app = useAppStore();

onMounted(() => {
  app.applyTheme();
});
</script>

<template>
  <div class="shell">
    <main class="shell__body">
      <RouterView v-slot="{ Component }">
        <component :is="Component" />
      </RouterView>
    </main>
    <TabBar />
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}
.shell__body {
  flex: 1;
  min-height: 0;
  padding-bottom: calc(var(--tabbar-h) + var(--safe-b));
}
</style>
