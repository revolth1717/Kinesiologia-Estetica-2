import { NextResponse } from "next/server";

function readTokenFromRequest(req: Request): string | undefined {
  const cookieHeader = req.headers.get("cookie") || "";
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [k, v] = part.trim().split("=");
    if (k === "authToken" && v) return decodeURIComponent(v);
  }
  try {
    const { cookies } = require("next/headers");
    const store = cookies();
    return store.get("authToken")?.value;
  } catch {
    return undefined;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.XANO_GENERAL_API_URL || process.env.XANO_AUTH_API_URL || "https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V";
const CONTENT_API_URL = process.env.NEXT_PUBLIC_CONTENT_API_URL || process.env.NEXT_PUBLIC_API_URL || process.env.XANO_GENERAL_API_URL || API_URL;
const PRODUCTS_PATH = process.env.NEXT_PUBLIC_PRODUCTS_PATH || "/product";
const ORDERS_PATH = process.env.NEXT_PUBLIC_ORDERS_PATH || "/order";

async function getMe(origin: string, cookieHeader: string): Promise<any> {
  const res = await fetch(`${origin}/api/auth/me`, { method: "GET", headers: { Accept: "application/json, text/plain, */*", Cookie: cookieHeader } });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

async function fetchProductById(id: string): Promise<any> {
  const target = `${CONTENT_API_URL}${PRODUCTS_PATH}/${encodeURIComponent(id)}`;
  const res = await fetch(target, { method: "GET", headers: { Accept: "application/json, text/plain, */*" } });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

async function updateProductStock(id: string, newStock: number, token?: string): Promise<{ ok: boolean; status: number; body: any }>
{
  const target = `${CONTENT_API_URL}${PRODUCTS_PATH}/${encodeURIComponent(id)}`;
  const res = await fetch(target, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ stock: newStock }),
  });
  const text = await res.text();
  let body: any = null;
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  return { ok: res.ok, status: res.status, body };
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export async function POST(req: Request): Promise<Response> {
  try {
    const token = readTokenFromRequest(req);
    if (!token) return NextResponse.json({ message: "Authentication Required" }, { status: 401 });
    const cookieHeader = req.headers.get("cookie") || "";
    const url = new URL(req.url);
    const origin = url.origin;
    const me = await getMe(origin, cookieHeader);
    const userId = me?.id ?? me?.user?.id ?? me?.profile?.id;
    if (!userId) return NextResponse.json({ message: "User not resolved" }, { status: 400 });

    const body = await req.json();
    const items: Array<{ product_id: string; quantity: number; unit_price: number }> = Array.isArray(body?.items) ? body.items : [];
    if (!items.length) return NextResponse.json({ message: "No items" }, { status: 400 });

    const results: any[] = [];
    for (let idx = 0; idx < items.length; idx++) {
      const { product_id, quantity, unit_price } = items[idx];
      const productData = await fetchProductById(product_id);
      const currentStockRaw = productData?.stock ?? productData?.producto?.stock ?? productData?.data?.stock;
      const currentStock = typeof currentStockRaw === "number" ? currentStockRaw : Number(currentStockRaw || 0);
      const nextStock = Math.max(0, currentStock - Number(quantity || 0));

      const orderPayload = {
        user_id: /^\d+$/.test(String(userId)) ? Number(userId) : userId,
        product_id,
        status: "confirmado",
        order_date: new Date().toISOString(),
        total: Number(unit_price) * Number(quantity),
        quantity: Number(quantity),
        unit_price: Number(unit_price),
      } as Record<string, unknown>;

      const orderTargets = [
        `${CONTENT_API_URL}${ORDERS_PATH}`,
        `${API_URL}${ORDERS_PATH}`,
        `${CONTENT_API_URL}/orders`,
        `${API_URL}/orders`,
      ];
      let orderRes: Response | null = null;
      let orderData: any = null;
      for (const target of orderTargets) {
        const r = await fetch(target, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(orderPayload) });
        const orderText = await r.text();
        try { orderData = JSON.parse(orderText); } catch { orderData = { raw: orderText }; }
        orderRes = r;
        if (r.ok) break;
        if (r.status !== 404) break;
      }
      if (!orderRes) {
        results.push({ order_ok: false, order_status: 502, order_data: { message: "No order endpoint" } });
        await sleep(1200);
        continue;
      }

      let stockRes: { ok: boolean; status: number; body: any } | null = null;
      if (orderRes.ok) {
        stockRes = await updateProductStock(product_id, nextStock, token);
        if (stockRes && stockRes.status === 429) {
          await sleep(2200);
          stockRes = await updateProductStock(product_id, nextStock, token);
        }
      }

      results.push({
        order_ok: orderRes.ok,
        order_status: orderRes.status,
        order_data: orderData,
        stock_updated: Boolean(stockRes?.ok),
        stock_status: stockRes?.status,
        next_stock: nextStock,
      });

      await sleep(1200);
    }

    return NextResponse.json({ success: true, results }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: "Unexpected error", detail: String(err?.message || err) }, { status: 500 });
  }
}