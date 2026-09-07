// Import / export the catalog as plain JSON. Everything created here syncs like
// any other local change.

import { useDataStore } from '@/stores/data';
import { needId, placementId } from './ids';
import {
  areasForStore,
  createArea,
  createProduct,
  createStore,
  setNeeded,
  setPlacement,
  updateProduct,
} from './domain';

export interface PortableProduct {
  name: string;
  qty?: string | null;
  note?: string | null;
  needed?: boolean;
  /** store names this product is bought at; optionally "Store: Aisle" */
  stores?: string[];
}

export interface PortableStore {
  name: string;
  aisles?: string[];
}

export interface PortableData {
  stores?: PortableStore[];
  products?: PortableProduct[];
}

export interface ImportSummary {
  storesAdded: number;
  aislesAdded: number;
  productsAdded: number;
  productsUpdated: number;
  placementsAdded: number;
  errors: string[];
}

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Accepts: a PortableData object, an array (products — strings or objects),
 * or a newline-separated string of product names (optionally "name, qty, note").
 */
export function parseImport(input: string | unknown): PortableData {
  let value: unknown = input;
  if (typeof input === 'string') {
    const text = input.trim();
    if (!text) return {};
    try {
      value = JSON.parse(text);
    } catch {
      // plain text: one product per line, "name, qty, note"
      const products = text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          const [name, qty, note] = line.split(',').map((p) => p.trim());
          return { name, qty: qty || null, note: note || null } as PortableProduct;
        })
        .filter((p) => p.name);
      return { products };
    }
  }

  const asProduct = (p: unknown): PortableProduct | null => {
    if (typeof p === 'string') return p.trim() ? { name: p.trim() } : null;
    if (p && typeof p === 'object' && typeof (p as PortableProduct).name === 'string') {
      return (p as PortableProduct).name.trim() ? (p as PortableProduct) : null;
    }
    return null;
  };

  if (Array.isArray(value)) {
    return { products: value.map(asProduct).filter((p): p is PortableProduct => p !== null) };
  }
  if (value && typeof value === 'object') {
    const v = value as PortableData;
    return {
      stores: Array.isArray(v.stores) ? v.stores.filter((s) => s?.name?.trim()) : undefined,
      products: Array.isArray(v.products)
        ? v.products.map(asProduct).filter((p): p is PortableProduct => p !== null)
        : undefined,
    };
  }
  return {};
}

export async function importData(data: PortableData): Promise<ImportSummary> {
  const store = useDataStore();
  const summary: ImportSummary = {
    storesAdded: 0,
    aislesAdded: 0,
    productsAdded: 0,
    productsUpdated: 0,
    placementsAdded: 0,
    errors: [],
  };

  const storeIdByName = new Map<string, string>();
  for (const s of store.active('stores')) storeIdByName.set(norm(s.name), s.id);

  async function resolveStore(name: string): Promise<string> {
    const key = norm(name);
    const existing = storeIdByName.get(key);
    if (existing) return existing;
    const id = await createStore(name.trim());
    storeIdByName.set(key, id);
    summary.storesAdded++;
    return id;
  }

  async function resolveArea(storeId: string, name: string): Promise<string> {
    const found = areasForStore(storeId).find((a) => norm(a.name) === norm(name));
    if (found) return found.id;
    const id = await createArea(storeId, name.trim());
    summary.aislesAdded++;
    return id;
  }

  for (const s of data.stores ?? []) {
    try {
      const id = await resolveStore(s.name);
      for (const aisle of s.aisles ?? []) {
        if (aisle?.trim()) await resolveArea(id, aisle);
      }
    } catch (e) {
      summary.errors.push(`store "${s.name}": ${(e as Error).message}`);
    }
  }

  const productIdByName = new Map<string, string>();
  for (const p of store.active('products')) productIdByName.set(norm(p.name), p.id);

  for (const p of data.products ?? []) {
    try {
      const key = norm(p.name);
      let id = productIdByName.get(key);
      if (id) {
        const patch: Record<string, string | null> = {};
        if (p.qty !== undefined) patch.default_qty = p.qty?.trim() || null;
        if (p.note !== undefined) patch.note = p.note?.trim() || null;
        if (Object.keys(patch).length) {
          await updateProduct(id, patch);
          summary.productsUpdated++;
        }
      } else {
        id = await createProduct({
          name: p.name,
          default_qty: p.qty ?? null,
          note: p.note ?? null,
        });
        productIdByName.set(key, id);
        summary.productsAdded++;
      }

      for (const entry of p.stores ?? []) {
        const [storeName, aisleName] = String(entry).split(':').map((x) => x.trim());
        if (!storeName) continue;
        const storeId = await resolveStore(storeName);
        const areaId = aisleName ? await resolveArea(storeId, aisleName) : null;
        if (!store.get('placements', placementId(id, storeId))) summary.placementsAdded++;
        await setPlacement(id, storeId, areaId);
      }

      if (p.needed) await setNeeded(id, true);
    } catch (e) {
      summary.errors.push(`product "${p.name}": ${(e as Error).message}`);
    }
  }

  return summary;
}

/** Dump the current catalog to a PortableData object (round-trips with importData). */
export function exportData(): PortableData {
  const store = useDataStore();
  const storeName = (id: string) => store.get('stores', id)?.name ?? '';
  const areaName = (id: string | null) =>
    id ? (store.get('areas', id)?.name ?? '') : '';

  return {
    stores: store
      .active('stores')
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((s) => ({
        name: s.name,
        aisles: areasForStore(s.id).map((a) => a.name),
      })),
    products: store
      .active('products')
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => {
        const need = store.get('needs', needId(p.id));
        const stores = store
          .active('placements')
          .filter((pl) => pl.product_id === p.id)
          .map((pl) => {
            const aisle = areaName(pl.area_id);
            return aisle ? `${storeName(pl.store_id)}: ${aisle}` : storeName(pl.store_id);
          })
          .filter(Boolean);
        return {
          name: p.name,
          ...(p.default_qty ? { qty: p.default_qty } : {}),
          ...(p.note ? { note: p.note } : {}),
          ...(need && !need.deleted ? { needed: true } : {}),
          ...(stores.length ? { stores } : {}),
        };
      }),
  };
}
