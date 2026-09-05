<script setup lang="ts">
import { computed } from 'vue';
import BottomSheet from './BottomSheet.vue';
import { useAppStore, type ThemePref } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useSyncStore } from '@/stores/sync';
import { syncNow } from '@/lib/sync';
import { showToast } from '@/lib/toast';
import { usePwaInstall } from '@/lib/usePwaInstall';

defineProps<{ open: boolean }>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();

const app = useAppStore();
const auth = useAuthStore();
const sync = useSyncStore();
const { canInstall, promptInstall } = usePwaInstall();

const themes: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const syncLabel = computed(() => {
  if (sync.status === 'syncing') return 'Syncing…';
  if (sync.status === 'offline') return 'Offline';
  if (sync.status === 'error') return sync.lastError || 'Sync error';
  if (sync.lastSyncedAt) {
    const mins = Math.round((Date.now() - sync.lastSyncedAt) / 60000);
    return mins <= 0 ? 'Synced just now' : `Synced ${mins}m ago`;
  }
  return 'Not synced yet';
});

function close() {
  emit('update:open', false);
}

async function signOut() {
  close();
  await auth.signOut(false);
}

async function resetLocal() {
  close();
  await auth.signOut(true);
  showToast('Local data cleared');
}
</script>

<template>
  <BottomSheet :open="open" title="Settings" @update:open="emit('update:open', $event)">
    <section class="grp">
      <h2 class="grp__label">Appearance</h2>
      <div class="seg" role="group" aria-label="Theme">
        <button
          v-for="t in themes"
          :key="t.value"
          class="seg__btn"
          :class="{ 'is-on': app.theme === t.value }"
          @click="app.setTheme(t.value)"
        >
          {{ t.label }}
        </button>
      </div>
    </section>

    <section class="grp">
      <h2 class="grp__label">Sync</h2>
      <div class="row">
        <span :class="['dot', `dot--${sync.status}`]" />
        <span class="row__main">{{ syncLabel }}</span>
        <span v-if="sync.pendingCount" class="row__badge">{{ sync.pendingCount }} pending</span>
        <button class="btn-ghost" @click="syncNow()">Sync now</button>
      </div>
    </section>

    <section v-if="canInstall" class="grp">
      <h2 class="grp__label">Install</h2>
      <button class="link" @click="promptInstall">Add to Home Screen</button>
    </section>

    <section class="grp">
      <h2 class="grp__label">Account</h2>
      <button class="link" @click="signOut">Sign out</button>
      <button class="link link--danger" @click="resetLocal">
        Sign out &amp; clear this device
      </button>
    </section>

    <p class="ver">Family Grocery · dev build</p>
  </BottomSheet>
</template>

<style scoped>
.grp {
  margin-bottom: var(--s-5);
}
.grp__label {
  margin: 0 0 var(--s-2);
  font-size: var(--t-caption);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--c-text-faint);
}
.seg {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--c-surface-2);
  border-radius: var(--r-md);
}
.seg__btn {
  flex: 1;
  padding: var(--s-2);
  border: none;
  border-radius: var(--r-sm);
  background: none;
  color: var(--c-text-dim);
  font-weight: 600;
  font-size: var(--t-body-sm);
}
.seg__btn.is-on {
  background: var(--c-surface);
  color: var(--c-text);
  box-shadow: var(--e-1);
}
.row {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  padding: var(--s-3);
  background: var(--c-surface-2);
  border-radius: var(--r-md);
  font-size: var(--t-body-sm);
}
.row__main {
  flex: 1;
}
.row__badge {
  font-size: var(--t-caption);
  color: var(--c-text-dim);
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: var(--r-full);
  background: var(--c-text-faint);
}
.dot--idle {
  background: var(--c-success);
}
.dot--syncing {
  background: var(--c-accent);
}
.dot--offline {
  background: var(--c-text-faint);
}
.dot--error {
  background: var(--c-danger);
}
.btn-ghost {
  border: none;
  background: none;
  color: var(--c-accent);
  font-weight: 600;
  padding: var(--s-1) var(--s-2);
}
.link {
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--s-3);
  border: none;
  background: none;
  color: var(--c-text);
  font-size: var(--t-body-sm);
}
.link--danger {
  color: var(--c-danger);
}
.ver {
  text-align: center;
  color: var(--c-text-faint);
  font-size: var(--t-caption);
}
</style>
