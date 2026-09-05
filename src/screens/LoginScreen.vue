<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const password = ref('');
const show = ref(false);
const busy = ref(false);

async function submit() {
  if (password.value.length < 4 || busy.value) return;
  busy.value = true;
  try {
    await auth.unlock(password.value);
    password.value = '';
  } catch {
    /* error surfaced via store */
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="login">
    <div class="login__inner">
      <div class="login__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="34" height="34">
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
        </svg>
      </div>
      <h1 class="login__title">Family Grocery</h1>
      <p class="login__sub">
        {{ auth.configured ? 'Enter the family password' : 'Choose a family password' }}
      </p>

      <form class="login__form" @submit.prevent="submit">
        <div class="login__field">
          <input
            :type="show ? 'text' : 'password'"
            v-model="password"
            class="login__input"
            :placeholder="auth.configured ? 'Password' : 'New password'"
            autocomplete="current-password"
            autocapitalize="off"
            autocorrect="off"
            :disabled="busy"
            enterkeyhint="go"
          />
          <button
            type="button"
            class="login__peek"
            :aria-label="show ? 'Hide password' : 'Show password'"
            @click="show = !show"
          >
            {{ show ? 'Hide' : 'Show' }}
          </button>
        </div>

        <button
          type="submit"
          class="login__submit"
          :disabled="busy || password.length < 4"
        >
          {{ busy ? '…' : auth.configured ? 'Unlock' : 'Create' }}
        </button>

        <p v-if="auth.error" class="login__err">{{ auth.error }}</p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login {
  flex: 1;
  display: grid;
  place-items: center;
  padding: var(--s-5);
  padding-top: calc(var(--safe-t) + var(--s-6));
}
.login__inner {
  width: 100%;
  max-width: 360px;
  text-align: center;
}
.login__mark {
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  margin: 0 auto var(--s-4);
  border-radius: var(--r-lg);
  background: var(--c-accent-soft);
  color: var(--c-accent);
}
.login__title {
  margin: 0 0 var(--s-1);
  font-size: var(--t-screen);
  letter-spacing: -0.02em;
}
.login__sub {
  margin: 0 0 var(--s-5);
  color: var(--c-text-dim);
}
.login__form {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
}
.login__field {
  display: flex;
  align-items: center;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  padding-right: var(--s-2);
}
.login__input {
  flex: 1;
  min-width: 0;
  padding: var(--s-4);
  border: none;
  background: none;
  border-radius: var(--r-md);
}
.login__input:focus {
  outline: none;
}
.login__field:focus-within {
  border-color: var(--c-accent);
}
.login__peek {
  border: none;
  background: none;
  color: var(--c-text-dim);
  font-size: var(--t-caption);
  font-weight: 600;
  padding: var(--s-2);
}
.login__submit {
  padding: var(--s-4);
  border: none;
  border-radius: var(--r-md);
  background: var(--c-accent);
  color: var(--c-accent-contrast);
  font-size: var(--t-body);
  font-weight: 700;
}
.login__submit:disabled {
  opacity: 0.45;
}
.login__submit:active {
  transform: scale(0.98);
}
.login__err {
  margin: 0;
  color: var(--c-danger);
  font-size: var(--t-body-sm);
}
</style>
