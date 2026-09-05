<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterView } from 'vue-router';
import TabBar from '@/components/TabBar.vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';

const app = useAppStore();
const auth = useAuthStore();

const password = ref('');
const busy = ref(false);

onMounted(() => {
  app.applyTheme();
  void auth.init();
});

async function submit() {
  busy.value = true;
  try {
    await auth.unlock(password.value);
    password.value = '';
  } catch {
    /* error shown from store */
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="shell">
    <template v-if="auth.checking">
      <div class="splash">Loading…</div>
    </template>

    <template v-else-if="!auth.isAuthed">
      <!-- Minimal gate; the styled Login screen lands in Phase 3. -->
      <form class="gate" @submit.prevent="submit">
        <h1>Family Grocery</h1>
        <p>{{ auth.configured ? 'Enter the family password' : 'Set a family password' }}</p>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="Password"
          :disabled="busy"
        />
        <button type="submit" :disabled="busy || password.length < 4">
          {{ auth.configured ? 'Unlock' : 'Create' }}
        </button>
        <p v-if="auth.error" class="gate__err">{{ auth.error }}</p>
      </form>
    </template>

    <template v-else>
      <main class="shell__body">
        <RouterView v-slot="{ Component }">
          <component :is="Component" />
        </RouterView>
      </main>
      <TabBar />
    </template>
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
.gate {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
  justify-content: center;
  padding: var(--s-6) var(--s-5);
  max-width: 360px;
  margin: 0 auto;
  width: 100%;
}
.gate h1 {
  font-size: var(--t-screen);
  margin: 0;
}
.gate p {
  margin: 0;
  color: var(--c-text-dim);
}
.gate input {
  padding: var(--s-3);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  background: var(--c-surface);
}
.gate button {
  padding: var(--s-3);
  border: none;
  border-radius: var(--r-md);
  background: var(--c-accent);
  color: var(--c-accent-contrast);
  font-weight: 600;
}
.gate button:disabled {
  opacity: 0.5;
}
.gate__err {
  color: var(--c-danger);
}
</style>
