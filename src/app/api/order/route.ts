import { NextResponse } from "next/server";

async function readTokenFromRequest(req: Request): Promise<string | undefined> {
  const cookieHeader = req.headers.get("cookie") || "";
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [k, v] = part.trim().split("=");
    if (k === "authToken" && v) return decodeURIComponent(v);
  }
  try {
    const { cookies } = require("next/headers");
    const store = await cookies();
    return store.get("authToken")?.value;
  } catch {
    return undefined;
  }
}

const API_URL =
  process.env.NEXT_PUBLIC_XANO_CONTENT_API ||
  process.env.NEXT_PUBLIC_XANO_CONTENT_API ||
  process.env.NEXT_PUBLIC_XANO_AUTH_API ||
  "https://x1xv-egpg-1mua.b2.xano.io/api:-E-1dvfg";
const CONTENT_API_URL =
  process.env.NEXT_PUBLIC_XANO_CONTENT_API ||
  process.env.NEXT_PUBLIC_XANO_CONTENT_API ||
  process.env.NEXT_PUBLIC_XANO_CONTENT_API ||
  API_URL;
const AUTH_API_URL =
  process.env.NEXT_PUBLIC_XANO_AUTH_API || process.env.NEXT_PUBLIC_XANO_AUTH_API || API_URL;
const ORDERS_PATH = process.env.NEXT_PUBLIC_ORDERS_PATH || "/order";
const PRODUCTS_PATH = process.env.NEXT_PUBLIC_PRODUCTS_PATH || "/product";
// URL específica para productos (stock) y pagos
const PRODUCT_API_URL = process.env.NEXT_PUBLIC_XANO_PAYMENT_API || "https://x1xv-egpg-1mua.b2.xano.io/api:SzJNIj2V";

async function getMe(origin: string, cookieHeader: string): Promise<any> {
  const res = await fetch(`${origin}/api/auth/me`, {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
      Cookie: cookieHeader,
    },
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function fetchProductById(id: string): Promise<any> {
  const target = `${PRODUCT_API_URL}${PRODUCTS_PATH}/${encodeURIComponent(id)}`;
  const res = await fetch(target, {
    method: "GET",
    headers: { Accept: "application/json, text/plain, */*" },
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function updateProductStock(
  id: string,
  newStock: number,
  token?: string
): Promise<{ ok: boolean; status: number; body: any }> {
  const target = `${PRODUCT_API_URL}${PRODUCTS_PATH}/${encodeURIComponent(id)}`;
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
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  return { ok: res.ok, status: res.status, body };
}

export async function GET(req: Request): Promise<Response> {
  try {
    const token = await readTokenFromRequest(req);
    if (!token)
      return NextResponse.json(
        { message: "Authentication Required" },
        { status: 401 }
      );

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    // Construct target URLs
    const targets = [];
    if (id) {
      targets.push(`${CONTENT_API_URL}${ORDERS_PATH}/${id}`);
      targets.push(`${API_URL}${ORDERS_PATH}/${id}`);
      targets.push(`${AUTH_API_URL}${ORDERS_PATH}/${id}`);
    } else {
      targets.push(`${CONTENT_API_URL}${ORDERS_PATH}`);
      targets.push(`${API_URL}${ORDERS_PATH}`);
      targets.push(`${AUTH_API_URL}${ORDERS_PATH}`);
      targets.push(`${CONTENT_API_URL}/orders`);
      targets.push(`${API_URL}/orders`);
    }

    let res: Response | null = null;
    let data: any = null;
    let lastStatus = 404;

    for (const target of targets) {
      res = await fetch(target, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      });

      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      if (res.ok) return NextResponse.json(data, { status: 200 });
      
      lastStatus = res.status;
      if (res.status !== 404 && res.status !== 405) {
        // If it's a real error (not just not found), return it
        return NextResponse.json(data, { status: res.status });
      }
    }

    return NextResponse.json(
      { message: "Endpoint not found", tried: targets },
      { status: lastStatus }
    );

  } catch (err: any) {
    return NextResponse.json(
      { message: "Unexpected error", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const token = await readTokenFromRequest(req);
    if (!token)
      return NextResponse.json(
        { message: "Authentication Required" },
        { status: 401 }
      );
    const cookieHeader = req.headers.get("cookie") || "";
    const url = new URL(req.url);
    const origin = url.origin;
    const me = await getMe(origin, cookieHeader);
    const userId = me?.id ?? me?.user?.id ?? me?.profile?.id;
    if (!userId)
      return NextResponse.json(
        { message: "User not resolved" },
        { status: 400 }
      );

    const body = await req.json();
    const productId: string = String(body?.product_id || "").trim();
    const quantity: number = Number(body?.quantity || 1);
    const unitPrice: number = Number(body?.unit_price || 0);
    if (!productId)
      return NextResponse.json(
        { message: "Missing product_id" },
        { status: 400 }
      );
    if (quantity <= 0)
      return NextResponse.json(
        { message: "Invalid quantity" },
        { status: 400 }
      );

    const productData = await fetchProductById(productId);
    const currentStockRaw =
      productData?.stock ??
      productData?.producto?.stock ??
      productData?.data?.stock;
    const currentStock =
      typeof currentStockRaw === "number"
        ? currentStockRaw
        : Number(currentStockRaw || 0);
    const nextStock = Math.max(0, currentStock - quantity);

    const orderPayload = {
      user_id: /^\d+$/.test(String(userId)) ? Number(userId) : userId,
      product_id: /^\d+$/.test(productId) ? Number(productId) : productId,
      status: body?.status || "confirmado",
      order_date: new Date().toISOString(),
      total: Number(unitPrice) * Number(quantity),
      quantity,
      unit_price: unitPrice,
    } as Record<string, unknown>;

    const candidates = [
      `${CONTENT_API_URL}${ORDERS_PATH}`,
      `${API_URL}${ORDERS_PATH}`,
      `${AUTH_API_URL}${ORDERS_PATH}`,
      `${CONTENT_API_URL}/orders`,
      `${API_URL}/orders`,
      `${AUTH_API_URL}/orders`,
      `${CONTENT_API_URL}${ORDERS_PATH}/create`,
      `${API_URL}${ORDERS_PATH}/create`,
      `${AUTH_API_URL}${ORDERS_PATH}/create`,
    ];
    let res: Response | null = null;
    let data: any = null;
    for (const target of candidates) {
      const bodies = [orderPayload, { input: orderPayload }];
      for (const body of bodies) {
        const r = await fetch(target, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        const t = await r.text();
        try {
          data = JSON.parse(t);
        } catch {
          data = { raw: t };
        }
        res = r;
        if (r.ok) break;
        if (r.status !== 404) break;
      }
      if (res && res.ok) break;
      if (res && res.status !== 404) break;
    }
    if (!res) {
      console.error("No order endpoint found. Candidates tried:", candidates);
      return NextResponse.json(
        { success: false, data: { message: "No order endpoint" } },
        { status: 502 }
      );
    }
    if (!res.ok) {
      console.error("Order creation failed at target:", res.url, "Status:", res.status, "Data:", data);
      return NextResponse.json(
        { success: false, data },
        { status: res.status }
      );
    }

    const stockRes = await updateProductStock(productId, nextStock, token);
    
    const responseBody = {
      success: res.ok,
      data,
      stock_updated: stockRes.ok,
      next_stock: nextStock,
      stock_status: stockRes.status,
      stock_body: stockRes.body,
    };
    return NextResponse.json(responseBody, { status: res.status });
  } catch (err: any) {
    console.error("Unexpected error in POST /api/order:", err);
    return NextResponse.json(
      { message: "Unexpected error", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request): Promise<Response> {
  try {
    const token = await readTokenFromRequest(req);
    if (!token)
      return NextResponse.json(
        { message: "Authentication Required" },
        { status: 401 }
      );
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const idRaw = String(
      url.searchParams.get("id") || body?.order_id || body?.id || ""
    ).trim();
    if (!idRaw)
      return NextResponse.json({ message: "Missing id" }, { status: 400 });
    const id = idRaw;
    const idNum = /^\d+$/.test(id) ? Number(id) : id;
    const payloadRoot = { status: body?.status ?? "entregado" } as any;

    const targets = [
      `${CONTENT_API_URL}${ORDERS_PATH}/${encodeURIComponent(id)}`,
      `${API_URL}${ORDERS_PATH}/${encodeURIComponent(id)}`,
      `${AUTH_API_URL}${ORDERS_PATH}/${encodeURIComponent(id)}`,
    ];
    let lastData: any = null;
    let lastStatus = 404;
    const methods = ["PATCH", "PUT"] as const;
    for (const target of targets) {
      let res: Response | null = null;
      let data: any = null;
      for (const m of methods) {
        res = await fetch(target, {
          method: m,
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payloadRoot),
        });
        if (res.status === 429) {
          await new Promise(r => setTimeout(r, 2200));
          res = await fetch(target, {
            method: m,
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json, text/plain, */*",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payloadRoot),
          });
        }
        const text = await res.text();
        try { data = JSON.parse(text); } catch { data = { raw: text }; }
        if (res.ok) return NextResponse.json(data, { status: 200 });
        lastData = data;
        lastStatus = res.status;
        if (res.status === 404 || res.status === 405) continue;
        return NextResponse.json(data, { status: res.status });
      }
    }
    const rootTargets = [
      `${CONTENT_API_URL}${ORDERS_PATH}`,
      `${API_URL}${ORDERS_PATH}`,
      `${AUTH_API_URL}${ORDERS_PATH}`,
    ];
    const bodies = [
      { order_id: idNum, ...payloadRoot },
      { input: { order_id: idNum, ...payloadRoot } },
      { id: idNum, ...payloadRoot },
      { input: { id: idNum, ...payloadRoot } },
    ];
    for (const target of rootTargets) {
      for (const b of bodies) {
        let res: Response | null = null;
        let data: any = null;
        for (const m of methods) {
          res = await fetch(target, {
            method: m,
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json, text/plain, */*",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(b),
          });
          if (res.status === 429) {
            await new Promise(r => setTimeout(r, 2200));
            res = await fetch(target, {
              method: m,
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json, text/plain, */*",
                "Content-Type": "application/json",
              },
              body: JSON.stringify(b),
            });
          }
          const text = await res.text();
          try { data = JSON.parse(text); } catch { data = { raw: text }; }
          if (res.ok) return NextResponse.json(data, { status: 200 });
          lastData = data;
          lastStatus = res.status;
          if (res.status === 404 || res.status === 405) continue;
          return NextResponse.json(data, { status: res.status });
        }
      }
    }
    return NextResponse.json(
      { ...lastData, tried: [...targets, ...rootTargets] },
      { status: lastStatus }
    );
  } catch (err: any) {
    return NextResponse.json(
      { message: "Unexpected error", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}
