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
const ORDERS_PATH = process.env.NEXT_PUBLIC_ORDERS_PATH || "/order";

export async function GET(req: Request): Promise<Response> {
  try {
    const now = Date.now();
    const ttlMs = 8000;
    if ((global as any).__ORDERS_ADMIN_CACHE && now - (global as any).__ORDERS_ADMIN_CACHE_AT < ttlMs) {
      const cached = (global as any).__ORDERS_ADMIN_CACHE;
      return NextResponse.json({ success: true, data: cached }, { status: 200 });
    }
    const token = readTokenFromRequest(req);
    if (!token) return NextResponse.json({ message: "Authentication Required" }, { status: 401 });

    const targets = [
      `${CONTENT_API_URL}${ORDERS_PATH}`,
      `${API_URL}${ORDERS_PATH}`,
      `${CONTENT_API_URL}/orders`,
      `${API_URL}/orders`,
      `${CONTENT_API_URL}/order`,
      `${API_URL}/order`,
    ];

    for (const target of targets) {
      let res = await fetch(target, { method: "GET", headers: { Authorization: `Bearer ${token}`, Accept: "application/json, text/plain, */*" } });
      if (res.status === 429) {
        const ra = res.headers.get("retry-after");
        const wait = ra && /^\d+$/.test(ra) ? parseInt(ra, 10) * 1000 : 2200;
        await new Promise(r => setTimeout(r, wait));
        res = await fetch(target, { method: "GET", headers: { Authorization: `Bearer ${token}`, Accept: "application/json, text/plain, */*" } });
      }
      const text = await res.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
      if (res.ok) {
        const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : (Array.isArray(data?.records) ? data.records : []);
        (global as any).__ORDERS_ADMIN_CACHE = list;
        (global as any).__ORDERS_ADMIN_CACHE_AT = Date.now();
        return NextResponse.json({ success: true, data: list }, { status: 200 });
      }
      if (res.status !== 404) return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: "Unexpected error", detail: String(err?.message || err) }, { status: 500 });
  }
}