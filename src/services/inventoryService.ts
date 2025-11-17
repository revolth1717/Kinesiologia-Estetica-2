export interface InventoryItem {
  id: number;
  product_id: number;
  product_name?: string;
  entry: number;
  exit: number;
  current_stock: number;
  record_date?: string | number;
  created_at?: string | number;
  product?: { id?: number; nombre?: string } | null;
}

const API_LOCAL_BASE = "/api/inventory";

type AnyObject = Record<string, unknown>;

class InventoryService {
  private getAuthHeaders() {
    return { "Content-Type": "application/json" } as const;
  }

  private normalize(raw: unknown): InventoryItem {
    const r = (raw ?? {}) as AnyObject;
    const num = (v: unknown, fb = 0) => {
      const n = Number(v as number | string);
      return Number.isFinite(n) ? n : fb;
    };

    // Handle relation object in product_id
    const productRel = (r.product_id ?? r.producto_id) as AnyObject | number | string | undefined;
    const productRelObj = typeof productRel === "object" && productRel !== null ? (productRel as AnyObject) : undefined;
    const productRelStr = typeof productRel === "string" ? (productRel as string) : undefined;
    const normalizedProductId = productRelObj ? num(productRelObj.id ?? productRelObj.ID, 0) : num(productRel, 0);
    const normalizedProduct = (() => {
      if (productRelObj) {
        const nombre = typeof productRelObj.nombre === "string" ? productRelObj.nombre : typeof productRelObj.name === "string" ? productRelObj.name : undefined;
        return { id: normalizedProductId, nombre } as { id?: number; nombre?: string };
      }
      const p = (r.product ?? r.producto) as AnyObject | undefined;
      if (p) {
        const id = num(p.id ?? (p as AnyObject).ID, normalizedProductId);
        const nombre = typeof p.nombre === "string" ? p.nombre : typeof p.name === "string" ? p.name : undefined;
        return { id, nombre } as { id?: number; nombre?: string };
      }
      return null;
    })();
    const normalizedProductName = ((): string | undefined => {
      const v = (r.product_name ?? r.producto_nombre ?? productRelStr ?? normalizedProduct?.nombre) as unknown;
      if (typeof v === "string") return v;
      return undefined;
    })();

    return {
      id: num(r.id, 0),
      product_id: normalizedProductId,
      product_name: normalizedProductName,
      entry: num(r.entry ?? r.entrada, 0) || 0,
      exit: num(r.exit ?? r.salida, 0) || 0,
      current_stock: num(r.current_stock ?? r.stock_actual, 0) || 0,
      record_date: (r.record_date ?? r.fecha ?? r.created_at) as string | number | undefined,
      created_at: r.created_at as string | number | undefined,
      product: normalizedProduct,
    };
  }

  async listar(): Promise<InventoryItem[]> {
    const res = await fetch(API_LOCAL_BASE, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    if (res.status === 404) {
      return [];
    }
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText}${txt ? ` - ${txt}` : ""}`);
    }
    const data = await res.json();
    const obj = data as AnyObject;
    let list: unknown[] = Array.isArray(data)
      ? (data as unknown[])
      : Array.isArray(obj.items)
      ? ((obj.items as unknown[]) ?? [])
      : Array.isArray(obj.data)
      ? ((obj.data as unknown[]) ?? [])
      : Array.isArray((obj as AnyObject)?.data?.data)
      ? ((((obj as AnyObject).data as AnyObject).data as unknown[]) ?? [])
      : Array.isArray(obj.results)
      ? ((obj.results as unknown[]) ?? [])
      : Array.isArray(obj.records)
      ? ((obj.records as unknown[]) ?? [])
      : Array.isArray((obj as AnyObject).inventory)
      ? ((((obj as AnyObject).inventory as unknown[]) ?? []))
      : Array.isArray((obj as AnyObject).inventario)
      ? ((((obj as AnyObject).inventario as unknown[]) ?? []))
      : [];
    if (!Array.isArray(list) || list.length === 0) {
      const values = Object.values(obj || {});
      const arrays = values.filter((v) => Array.isArray(v)) as unknown[][];
      if (arrays.length > 0) list = arrays[0] || [];
      if ((!list || list.length === 0) && values.length > 0) {
        for (const v of values) {
          if (v && typeof v === "object" && !Array.isArray(v)) {
            const nested = Object.values(v as AnyObject).find((x) => Array.isArray(x)) as unknown[] | undefined;
            if (nested && nested.length) {
              list = nested;
              break;
            }
          }
        }
      }
    }
    return list.map((x) => this.normalize(x));
  }

  private latestStockByProductName(items: InventoryItem[], productName: string): number {
    const filtered = items.filter((i) => String(i.product_name ?? i.product?.nombre ?? "") === String(productName));
    if (filtered.length === 0) return 0;
    const sorted = filtered.slice().sort((a, b) => Number(a.id) - Number(b.id));
    return sorted[sorted.length - 1].current_stock || 0;
  }

  async registrarEntrada(productName: string, cantidad: number): Promise<InventoryItem> {
    if (!productName || cantidad <= 0) throw new Error("Entrada inválida");
    const items = await this.listar().catch(() => []);
    const prev = this.latestStockByProductName(items, productName);
    const payload = {
      product_name: productName,
      entry: cantidad,
      exit: 0,
      current_stock: prev + cantidad,
      record_date: new Date().toISOString(),
    } as Record<string, unknown>;
    const res = await fetch(API_LOCAL_BASE, {
      method: "POST",
      headers: this.getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text || `Error ${res.status}`);
    const parsed: unknown = (() => {
      try {
        return JSON.parse(text);
      } catch {
        return { raw: text } as unknown;
      }
    })();
    const item = Array.isArray(parsed) ? (parsed as unknown[])[0] : parsed;
    return this.normalize(item);
  }

  async registrarSalida(productName: string, cantidad: number): Promise<InventoryItem> {
    if (!productName || cantidad <= 0) throw new Error("Salida inválida");
    const items = await this.listar().catch(() => []);
    const prev = this.latestStockByProductName(items, productName);
    const next = Math.max(0, prev - cantidad);
    const payload = {
      product_name: productName,
      entry: 0,
      exit: cantidad,
      current_stock: next,
      record_date: new Date().toISOString(),
    } as Record<string, unknown>;
    const res = await fetch(API_LOCAL_BASE, {
      method: "POST",
      headers: this.getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text || `Error ${res.status}`);
    const parsed: unknown = (() => {
      try {
        return JSON.parse(text);
      } catch {
        return { raw: text } as unknown;
      }
    })();
    const item = Array.isArray(parsed) ? (parsed as unknown[])[0] : parsed;
    return this.normalize(item);
  }
}

export const inventoryService = new InventoryService();