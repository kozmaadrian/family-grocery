<script setup lang="ts">
defineProps<{ checked: boolean; label: string }>();
const emit = defineEmits<{ toggle: [] }>();
</script>

<template>
  <button
    class="check"
    :class="{ 'is-on': checked }"
    :aria-pressed="checked"
    :aria-label="label"
    @click.stop="emit('toggle')"
  >
    <svg v-if="checked" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M5 12l4 4L19 7"
        fill="none"
        stroke="currentColor"
        stroke-width="2.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>

<style scoped>
.check {
  flex: none;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 2px solid var(--c-border);
  border-radius: var(--r-full);
  background: var(--c-surface);
  color: var(--c-accent-contrast);
  transition:
    background var(--dur) var(--ease),
    border-color var(--dur) var(--ease),
    transform var(--dur) var(--ease);
}
.check.is-on {
  background: var(--c-accent);
  border-color: var(--c-accent);
  animation: pop 0.25s var(--ease);
}
.check:active {
  transform: scale(0.9);
}
@keyframes pop {
  40% {
    transform: scale(1.18);
  }
}
</style>
