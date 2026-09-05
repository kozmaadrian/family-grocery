<script setup lang="ts">
import { computed, ref } from 'vue';
import ScreenHeader from '@/components/ScreenHeader.vue';
import ShopRow from '@/components/ShopRow.vue';
import QuickAddBar from '@/components/QuickAddBar.vue';
import StorePickerSheet from '@/components/StorePickerSheet.vue';
import ItemSheet from '@/components/ItemSheet.vue';
import { useDataStore } from '@/stores/data';
import { useShopStore } from '@/stores/shop';
import { useShoppingView } from '@/lib/shopping';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import { syncNow } from '@/lib/sync';
import { finishShopping, restoreNeeds, setNeedStatus, setNeeded } from '@/lib/domain';
import { showToast } from '@/lib/toast';

const data = useDataStore();
const shop = useShopStore();

const storeId = computed(() => shop.storeId);
const view = useShoppingView(storeId);

const currentStoreName = computed(() =>
  storeId.value ? (data.get('stores', storeId.value)?.name ?? 'Store') : 'Any store',
);

const pickerOpen = ref(false);
const itemOpen = ref(false);
const itemProductId = ref<string | null>(null);
const inCartOpen = ref(false);
const notSoldOpen = ref(false);

const { distance, refreshing } = usePullToRefresh(() => syncNow());

function openItem(productId: string) {
  itemProductId.value = productId;
  itemOpen.value = true;
}

async function toggle(productId: string, checked: boolean) {
  await setNeedStatus(productId, checked ? 'in_cart' : 'needed');
}

async function removeItem(productId: string, name: string) {
  await setNeeded(productId, false);
  showToast(`Removed ${name}`, { action: { label: 'Undo', run: () => setNeeded(productId, true) } });
}

async function finish() {
  const ids = await finishShopping();
  if (ids.length) {
    showToast(`${ids.length} item${ids.length > 1 ? 's' : ''} cleared`, {
      action: { label: 'Undo', run: () => restoreNeeds(ids) },
    });
  }
}

const empty = computed(
  () =>
    view.value.groups.length === 0 &&
    view.value.notSoldHere.length === 0 &&
    view.value.inCart.length === 0,
);
</script>

<template>
  <div class="screen">
    <ScreenHeader :title="currentStoreName">
      <template #actions>
        <button class="switch" @click="pickerOpen = true">
          <span>{{ view.coverage.covered }}/{{ view.coverage.total }}</span>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </template>
    </ScreenHeader>

    <div
      v-if="distance > 0 || refreshing"
      class="ptr"
      :style="{ height: `${Math.min(distance, 1) * 44}px`, opacity: Math.min(distance, 1) }"
    >
      <span class="ptr__spin" :class="{ 'is-active': refreshing }">↻</span>
    </div>

    <div
      v-if="view.totalToBuy > 0 || view.inCart.length > 0"
      class="progress"
    >
      <div
        class="progress__fill"
        :style="{
          width: `${(view.inCart.length / Math.max(1, view.inCart.length + view.totalToBuy)) * 100}%`,
        }"
      />
      <span class="progress__label">
        {{ view.inCart.length }} of {{ view.inCart.length + view.totalToBuy }} in cart
      </span>
    </div>

    <div class="body">
      <p v-if="empty" class="empty">
        Nothing to buy{{ storeId ? ' here' : '' }} yet.<br />
        Add items below, or tick products on the Products tab.
      </p>

      <section v-for="g in view.groups" :key="g.key" class="group">
        <button class="group__head" @click="shop.toggleGroup(g.key)">
          <svg
            class="group__chev"
            :class="{ 'is-collapsed': shop.collapsed.has(g.key) }"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden="true"
          >
            <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="group__title">{{ g.title }}</span>
          <span class="group__count">{{ g.items.length }}</span>
        </button>
        <template v-if="!shop.collapsed.has(g.key)">
          <ShopRow
            v-for="it in g.items"
            :key="it.need.id"
            :item="it"
            :checked="false"
            :show-stores="!storeId"
            @toggle="toggle(it.product.id, true)"
            @remove="removeItem(it.product.id, it.product.name)"
            @open="openItem(it.product.id)"
          />
        </template>
      </section>

      <section v-if="view.notSoldHere.length" class="group">
        <button class="group__head" @click="notSoldOpen = !notSoldOpen">
          <svg class="group__chev" :class="{ 'is-collapsed': !notSoldOpen }" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="group__title">Not sold here</span>
          <span class="group__count">{{ view.notSoldHere.length }}</span>
        </button>
        <template v-if="notSoldOpen">
          <ShopRow
            v-for="it in view.notSoldHere"
            :key="it.need.id"
            :item="it"
            :checked="false"
            show-stores
            @toggle="toggle(it.product.id, true)"
            @remove="removeItem(it.product.id, it.product.name)"
            @open="openItem(it.product.id)"
          />
        </template>
      </section>

      <section v-if="view.inCart.length" class="group">
        <button class="group__head" @click="inCartOpen = !inCartOpen">
          <svg class="group__chev" :class="{ 'is-collapsed': !inCartOpen }" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="group__title">In cart</span>
          <span class="group__count">{{ view.inCart.length }}</span>
        </button>
        <template v-if="inCartOpen">
          <ShopRow
            v-for="it in view.inCart"
            :key="it.need.id"
            :item="it"
            :checked="true"
            @toggle="toggle(it.product.id, false)"
            @remove="removeItem(it.product.id, it.product.name)"
            @open="openItem(it.product.id)"
          />
        </template>
        <button class="finish" @click="finish">Finish shopping</button>
      </section>
    </div>

    <QuickAddBar :store-id="storeId" />

    <StorePickerSheet
      v-model:open="pickerOpen"
      :selected="storeId"
      @pick="shop.selectStore($event)"
    />
    <ItemSheet
      v-model:open="itemOpen"
      :product-id="itemProductId"
      :store-id="storeId"
    />
  </div>
</template>

<style scoped>
.screen {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
.switch {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px 6px 12px;
  border: none;
  border-radius: var(--r-full);
  background: var(--c-accent-soft);
  color: var(--c-accent);
  font-weight: 700;
  font-size: var(--t-body-sm);
}
.ptr {
  display: grid;
  place-items: center;
  overflow: hidden;
  color: var(--c-text-faint);
}
.ptr__spin.is-active {
  animation: spin 0.8s linear infinite;
}
.progress {
  position: relative;
  height: 24px;
  margin: 0 var(--s-4) var(--s-2);
  background: var(--c-surface-2);
  border-radius: var(--r-full);
  overflow: hidden;
}
.progress__fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--c-accent-soft);
  transition: width var(--dur) var(--ease);
}
.progress__label {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: var(--t-caption);
  font-weight: 600;
  color: var(--c-text-dim);
}
.body {
  flex: 1;
  padding-bottom: calc(var(--tabbar-h) + var(--safe-b) + 64px);
}
.empty {
  color: var(--c-text-dim);
  text-align: center;
  padding: var(--s-6) var(--s-4);
  line-height: 1.6;
}
.group {
  margin-bottom: var(--s-2);
}
.group__head {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  width: 100%;
  padding: var(--s-2) var(--s-4);
  border: none;
  background: none;
  color: var(--c-text-dim);
}
.group__chev {
  transition: transform var(--dur) var(--ease);
}
.group__chev.is-collapsed {
  transform: rotate(0);
}
.group__chev:not(.is-collapsed) {
  transform: rotate(90deg);
}
.group__title {
  font-size: var(--t-caption);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.group__count {
  margin-left: auto;
  font-size: var(--t-caption);
  color: var(--c-text-faint);
}
.finish {
  display: block;
  width: calc(100% - 2 * var(--s-4));
  margin: var(--s-3) var(--s-4) 0;
  padding: var(--s-3);
  border: none;
  border-radius: var(--r-md);
  background: var(--c-accent);
  color: var(--c-accent-contrast);
  font-weight: 700;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
