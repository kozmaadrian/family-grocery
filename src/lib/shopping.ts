import { computed, type ComputedRef } from 'vue';
import type { Need, Placement, Product } from '@shared/types';
import { useDataStore } from '@/stores/data';
import { areasForStore, placementsForStore } from './domain';

export interface ShopItem {
  need: Need;
  product: Product;
  placement?: Placement;
  /** stores (names) that carry this product — for "Any store" mode */
  storeNames: string[];
}

export interface ShopGroup {
  key: string;
  title: string;
  items: ShopItem[];
}

export interface ShoppingView {
  groups: ShopGroup[];
  notSoldHere: ShopItem[];
  inCart: ShopItem[];
  coverage: { covered: number; total: number };
  totalToBuy: number;
}

const UNSORTED = 'unsorted';

export function useShoppingView(storeId: ComputedRef<string>): ComputedRef<ShoppingView> {
  const data = useDataStore();

  return computed(() => {
    const products = new Map(data.active('products').map((p) => [p.id, p]));
    const storeNamesByProduct = (productId: string) =>
      data
        .active('placements')
        .filter((p) => p.product_id === productId)
        .map((p) => data.get('stores', p.store_id)?.name)
        .filter((n): n is string => Boolean(n));

    const needs = data.active('needs').filter((n) => products.has(n.product_id));
    const needed = needs.filter((n) => n.status === 'needed');
    const inCartNeeds = needs.filter((n) => n.status === 'in_cart');

    const toItem = (need: Need, placement?: Placement): ShopItem => ({
      need,
      placement,
      product: products.get(need.product_id)!,
      storeNames: storeNamesByProduct(need.product_id),
    });

    // "Any store" — one flat, name-sorted list.
    if (!storeId.value) {
      const groups: ShopGroup[] = [];
      const all = needed
        .map((n) => toItem(n))
        .sort((a, b) => a.product.name.localeCompare(b.product.name));
      if (all.length) groups.push({ key: 'all', title: 'To buy', items: all });
      return {
        groups,
        notSoldHere: [],
        inCart: inCartNeeds
          .map((n) => toItem(n))
          .sort((a, b) => a.product.name.localeCompare(b.product.name)),
        coverage: { covered: needed.length, total: needed.length },
        totalToBuy: needed.length,
      };
    }

    const placementByProduct = new Map(
      placementsForStore(storeId.value).map((p) => [p.product_id, p]),
    );
    const areas = areasForStore(storeId.value);

    const groups: ShopGroup[] = [];
    for (const area of areas) {
      const items = needed
        .filter((n) => placementByProduct.get(n.product_id)?.area_id === area.id)
        .map((n) => toItem(n, placementByProduct.get(n.product_id)))
        .sort((a, b) => (a.placement?.position ?? 0) - (b.placement?.position ?? 0));
      if (items.length) groups.push({ key: area.id, title: area.name, items });
    }

    const unsorted = needed
      .filter((n) => {
        const p = placementByProduct.get(n.product_id);
        return p && p.area_id === null;
      })
      .map((n) => toItem(n, placementByProduct.get(n.product_id)))
      .sort((a, b) => (a.placement?.position ?? 0) - (b.placement?.position ?? 0));
    if (unsorted.length) groups.push({ key: UNSORTED, title: 'Unsorted', items: unsorted });

    const notSoldHere = needed
      .filter((n) => !placementByProduct.has(n.product_id))
      .map((n) => toItem(n))
      .sort((a, b) => a.product.name.localeCompare(b.product.name));

    const inCart = inCartNeeds
      .map((n) => toItem(n, placementByProduct.get(n.product_id)))
      .sort((a, b) => a.product.name.localeCompare(b.product.name));

    const covered = needed.length - notSoldHere.length;
    return {
      groups,
      notSoldHere,
      inCart,
      coverage: { covered, total: needed.length },
      totalToBuy: covered,
    };
  });
}
