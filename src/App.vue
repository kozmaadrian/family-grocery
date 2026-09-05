<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import TabBar from '@/components/TabBar.vue';
import ToastHost from '@/components/ToastHost.vue';
import SettingsSheet from '@/components/SettingsSheet.vue';
import LoginScreen from '@/screens/LoginScreen.vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';

const app = useAppStore();
const auth = useAuthStore();

onMounted(() => {
  app.applyTheme();
  void auth.init();
});
</script>

<template>
  <div class="shell">
    <div v-if="auth.checking" class="splash">Loading…</div>

    <LoginScreen v-else-if="!auth.isAuthed" />

    <template v-else>
      <main class="shell__body">
        <RouterView v-slot="{ Component }">
          <component :is="Component" />
        </RouterView>
      </main>
      <TabBar />
      <SettingsSheet v-model:open="app.settingsOpen" />
    </template>

    <ToastHost />
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
.splash {
  flex: 1;
  display: grid;
  place-items: center;
  color: var(--c-text-dim);
}
</style>
