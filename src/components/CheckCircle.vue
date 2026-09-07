<script setup lang="ts">
withDefaults(defineProps<{ checked: boolean; label: string; variant?: 'check' | 'add' }>(), {
  variant: 'check',
});
const emit = defineEmits<{ toggle: [] }>();
</script>

<template>
  <button
    class="check"
    :class="{
      'is-on': checked && variant === 'check',
      'is-pending': variant === 'check' && !checked,
      'is-add': variant === 'add' && !checked,
      'is-remove': variant === 'add' && checked,
    }"
    :aria-pressed="checked"
    :aria-label="label"
    @click.stop="emit('toggle')"
  >
    <!-- Shop: tick when in cart -->
    <svg
      v-if="variant === 'check' && checked"
      class="check__tick"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <path
        d="M5 13l4.2 4.2L19 7.5"
        fill="none"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <!-- Products: + to add, − to remove -->
    <svg v-else-if="variant === 'add'" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path
        v-if="!checked"
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        stroke-width="2.6"
        stroke-linecap="round"
      />
      <path v-else d="M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" />
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
  padding: 0;
  border: 2px solid var(--c-border);
  border-radius: var(--r-full);
  background: var(--c-surface);
  color: var(--c-accent-contrast);
  transition:
    background var(--dur) var(--ease),
    border-color var(--dur) var(--ease),
    color var(--dur) var(--ease),
    transform var(--dur) var(--ease);
}
.check__tick {
  display: block;
  /* optical centring — a checkmark reads slightly low-left of geometric centre */
  transform: translate(0.5px, -0.5px);
}
.check.is-pending {
  border-style: dashed;
  border-color: var(--c-text-faint);
}
.check.is-add {
  border-color: var(--c-accent);
  color: var(--c-accent);
}
.check.is-remove {
  border-color: var(--c-danger);
  color: var(--c-danger);
  background: var(--c-danger-soft);
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
