<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();

const tabs = [
  { to: '/shop', tab: 'shop', label: 'Shop', icon: 'cart' },
  { to: '/products', tab: 'products', label: 'Products', icon: 'list' },
  { to: '/stores', tab: 'stores', label: 'Stores', icon: 'store' },
] as const;
</script>

<template>
  <nav class="tabbar" aria-label="Primary">
    <RouterLink
      v-for="t in tabs"
      :key="t.tab"
      :to="t.to"
      class="tabbar__item"
      :class="{ 'is-active': route.meta.tab === t.tab }"
    >
      <svg class="tabbar__icon" viewBox="0 0 24 24" aria-hidden="true">
        <template v-if="t.icon === 'cart'">
          <path
            d="M3 4h2l2.4 12.3a2 2 0 0 0 2 1.7h8.2a2 2 0 0 0 2-1.6L23 8H6"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <circle cx="10" cy="21" r="1.6" fill="currentColor" />
          <circle cx="18" cy="21" r="1.6" fill="currentColor" />
        </template>
        <template v-else-if="t.icon === 'list'">
          <path
            d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </template>
        <template v-else>
          <path
            d="M4 9 5.5 4h13L20 9M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9M4 9h16M9 20v-5h6v5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </template>
      </svg>
      <span class="tabbar__label">{{ t.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  display: flex;
  height: calc(var(--tabbar-h) + var(--safe-b));
  padding-bottom: var(--safe-b);
  background: var(--c-surface);
  border-top: 1px solid var(--c-border);
  box-shadow: var(--e-up);
}
.tabbar__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-decoration: none;
  color: var(--c-text-faint);
  transition: color var(--dur) var(--ease);
  -webkit-tap-highlight-color: transparent;
}
.tabbar__item.is-active {
  color: var(--c-accent);
}
.tabbar__item:active {
  opacity: 0.6;
}
.tabbar__icon {
  width: 24px;
  height: 24px;
}
.tabbar__label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.01em;
}
</style>
