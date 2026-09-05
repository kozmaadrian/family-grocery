<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { useScrolled } from '@/lib/useScrolled';

const props = withDefaults(
  defineProps<{ title: string; settings?: boolean; back?: string }>(),
  { settings: true },
);

const app = useAppStore();
const router = useRouter();
const scrolled = useScrolled(10);

function goBack() {
  if (props.back) router.push(props.back);
  else router.back();
}
</script>

<template>
  <header class="hdr" :data-collapsed="scrolled">
    <button v-if="back !== undefined" class="hdr__back" aria-label="Back" @click="goBack">
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    <h1 class="hdr__title">{{ title }}</h1>
    <div class="hdr__actions">
      <slot name="actions" />
      <button
        v-if="settings"
        class="hdr__gear"
        aria-label="Settings"
        @click="app.settingsOpen = true"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          />
          <path
            d="M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0v-.1A1.7 1.7 0 0 0 7 19.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 13H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.8 7L4.7 6.9A2 2 0 1 1 7.5 4.1l.1.1A1.7 1.7 0 0 0 10.5 3.4V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1H22a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
.hdr {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  padding: calc(var(--safe-t) + var(--s-3)) var(--s-4) var(--s-3);
  background: var(--c-bg);
  border-bottom: 1px solid transparent;
  transition:
    padding var(--dur) var(--ease),
    border-color var(--dur) var(--ease);
}
.hdr[data-collapsed='true'] {
  padding-top: calc(var(--safe-t) + var(--s-2));
  padding-bottom: var(--s-2);
  border-bottom-color: var(--c-border);
}
.hdr__back {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  margin-left: -6px;
  margin-right: var(--s-1);
  border: none;
  border-radius: var(--r-full);
  background: none;
  color: var(--c-text);
}
.hdr__back:active {
  background: var(--c-surface-2);
}
.hdr__title {
  margin: 0;
  margin-right: auto;
  font-size: var(--t-screen);
  font-weight: 700;
  letter-spacing: -0.02em;
  transition: font-size var(--dur) var(--ease);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hdr[data-collapsed='true'] .hdr__title {
  font-size: var(--t-title);
}
.hdr__actions {
  display: flex;
  align-items: center;
  gap: var(--s-2);
}
.hdr__gear {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--r-full);
  background: var(--c-surface-2);
  color: var(--c-text-dim);
}
.hdr__gear:active {
  transform: scale(0.94);
}
</style>
