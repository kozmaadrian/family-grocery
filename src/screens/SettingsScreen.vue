<script setup lang="ts">
import { computed, ref } from 'vue';
import ScreenHeader from '@/components/ScreenHeader.vue';
import ImportSheet from '@/components/ImportSheet.vue';
import ExportSheet from '@/components/ExportSheet.vue';
import ConfirmSheet from '@/components/ConfirmSheet.vue';
import AuthLogSheet from '@/components/AuthLogSheet.vue';
import { useAppStore, type ThemePref } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useSyncStore } from '@/stores/sync';
import { syncNow } from '@/lib/sync';
import { showToast } from '@/lib/toast';
import { usePwaInstall } from '@/lib/usePwaInstall';

const app = useAppStore();
const auth = useAuthStore();
const sync = useSyncStore();
const { canInstall, promptInstall } = usePwaInstall();

const appVersion = __APP_VERSION__;

const VERSION_BEFORE_RELOAD_KEY = 'grocery:versionBeforeReload';

const checking = ref(false);
const updateAvailable = ref(false);
const justUpdated = ref(false);

// Fires once on load if the previous "Update now" reload actually changed
// the running version — see forceReload().
const versionBeforeReload = localStorage.getItem(VERSION_BEFORE_RELOAD_KEY);
if (versionBeforeReload) {
  localStorage.removeItem(VERSION_BEFORE_RELOAD_KEY);
  if (versionBeforeReload === appVersion) {
    showToast("You're already on the latest version");
  } else {
    justUpdated.value = true;
    showToast('Updated ✓');
  }
}

async function checkForUpdate() {
  if (checking.value) return;
  checking.value = true;
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('bad response');
    const data: { version?: string } = await res.json();
    updateAvailable.value = Boolean(data.version && data.version !== appVersion);
    if (!updateAvailable.value) showToast("You're on the latest version");
  } catch {
    showToast('Could not check for updates — check your connection');
  } finally {
    checking.value = false;
  }
}

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

async function signOut() {
  await auth.signOut(false);
}

async function resetLocal() {
  await auth.signOut(true);
  showToast('Local data cleared');
}

async function logoutEveryone() {
  try {
    await auth.logoutEveryone();
    showToast('All devices signed out');
  } catch {
    showToast('Could not reach the server');
  }
}

async function forceReload() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } finally {
    // tells main.ts's controllerchange handler not to reload a second time
    // once the freshly re-registered service worker claims this page
    sessionStorage.setItem('grocery:manualReload', '1');
    // read back on the other side of the reload to say whether it actually
    // picked up a new version, instead of leaving that to the version number
    localStorage.setItem(VERSION_BEFORE_RELOAD_KEY, appVersion);
    location.reload();
  }
}

const importOpen = ref(false);
const exportOpen = ref(false);
const authLogOpen = ref(false);
const signOutOpen = ref(false);
const resetOpen = ref(false);
const logoutAllOpen = ref(false);
</script>

<template>
  <div class="screen">
    <ScreenHeader title="Settings" />

    <div class="body">
      <section class="grp">
        <h2 class="grp__label u-eyebrow">Appearance</h2>
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
        <div class="grp__head">
          <h2 class="grp__label u-eyebrow">Sync</h2>
          <span class="grp__meta">
            <span :class="['dot', `dot--${sync.status}`]" />
            {{ syncLabel }}
            <span v-if="sync.pendingCount" class="row__badge">{{ sync.pendingCount }} pending</span>
          </span>
        </div>
        <button class="link" @click="syncNow()">Sync now</button>
      </section>

      <section class="grp">
        <h2 class="grp__label u-eyebrow">Help</h2>
        <a class="link" href="/guide/">
          User guide
          <svg class="link__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </a>
      </section>

      <section class="grp">
        <h2 class="grp__label u-eyebrow">Updates</h2>
        <button
          v-if="!updateAvailable"
          class="link"
          :disabled="checking"
          @click="checkForUpdate"
        >
          {{ checking ? 'Checking…' : 'Check for updates' }}
        </button>
        <button v-else class="link link--accent" @click="forceReload">
          New version available — tap to install
        </button>
        <p class="ver" :class="{ 'ver--updated': justUpdated }">Version {{ appVersion }}</p>
      </section>

      <section v-if="canInstall" class="grp">
        <h2 class="grp__label u-eyebrow">Install</h2>
        <button class="link" @click="promptInstall">Add to Home Screen</button>
      </section>

      <section class="grp">
        <h2 class="grp__label u-eyebrow">Catalog</h2>
        <button class="link" @click="importOpen = true">Import</button>
        <button class="link" @click="exportOpen = true">Export</button>
      </section>

      <section class="grp">
        <h2 class="grp__label u-eyebrow">Sessions</h2>
        <button class="link" @click="authLogOpen = true">Sign-in log</button>
        <button class="link link--danger" @click="logoutAllOpen = true">
          Log out all devices
        </button>
      </section>

      <section class="grp">
        <h2 class="grp__label u-eyebrow">This device</h2>
        <button class="link" @click="signOutOpen = true">Sign out</button>
        <button class="link link--danger" @click="resetOpen = true">
          Sign out &amp; erase this device
        </button>
      </section>
    </div>

    <ImportSheet v-model:open="importOpen" />
    <ExportSheet v-model:open="exportOpen" />
    <AuthLogSheet v-model:open="authLogOpen" />
    <ConfirmSheet
      v-model:open="signOutOpen"
      title="Sign out?"
      message="You'll need the family password to get back in. Your saved list stays on this device."
      confirm-label="Sign out"
      @confirm="signOut"
    />
    <ConfirmSheet
      v-model:open="resetOpen"
      title="Sign out & erase this device?"
      message="Signs out and deletes this device's local copy of the list. Anything not yet synced is lost. The family data on the server is untouched."
      confirm-label="Erase"
      danger
      @confirm="resetLocal"
    />
    <ConfirmSheet
      v-model:open="logoutAllOpen"
      title="Log out all devices?"
      message="Every family member — including this device — will need to enter the family password again. Use this if a device was lost."
      confirm-label="Log out all"
      danger
      @confirm="logoutEveryone"
    />
  </div>
</template>

<style scoped>
.screen {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
.body {
  padding: var(--s-2) var(--s-4);
  padding-bottom: calc(var(--tabbar-h) + var(--safe-b) + var(--s-5));
}
.grp {
  margin-bottom: var(--s-5);
}
.grp__label {
  margin: 0 0 var(--s-2);
}
.grp__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s-2);
  margin: 0 0 var(--s-2);
}
.grp__head .grp__label {
  margin: 0;
}
.grp__meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--c-text-faint);
  font-size: var(--t-caption);
  font-weight: 400;
  text-transform: none;
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
  min-height: var(--control-h);
  padding: 0 var(--s-3);
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
.row__badge {
  font-size: var(--t-caption);
  color: var(--c-text-dim);
}
.dot {
  display: inline-block;
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
.link {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--control-h);
  padding: var(--s-2) var(--s-3);
  border: none;
  border-radius: var(--r-md);
  background: var(--c-surface-2);
  color: var(--c-text);
  font-size: var(--t-body);
  text-align: left;
  text-decoration: none;
}
.link__arrow {
  flex: none;
  width: 18px;
  height: 18px;
  margin-left: auto;
  color: var(--c-text-faint);
}
.link + .link {
  margin-top: var(--s-3);
}
.link + .link--danger {
  margin-top: var(--s-5);
}
.link:active {
  background: var(--c-border);
}
.link--danger {
  color: var(--c-danger);
}
.link--accent {
  background: var(--c-accent-soft);
  color: var(--c-accent);
  font-weight: 600;
}
.link:disabled {
  opacity: 0.6;
}
.ver {
  margin: var(--s-2) 0 0;
  text-align: center;
  color: var(--c-text-faint);
  font-size: var(--t-caption);
}
.ver--updated {
  color: var(--c-accent);
  font-weight: 600;
}
</style>
