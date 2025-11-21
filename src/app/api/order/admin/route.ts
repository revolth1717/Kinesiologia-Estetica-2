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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.XANO_GENERAL_API_URL ||
  process.env.XANO_AUTH_API_URL ||
  "https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V";
const CONTENT_API_URL =
  process.env.NEXT_PUBLIC_CONTENT_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.XANO_GENERAL_API_URL ||
  API_URL;
const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_URL || process.env.XANO_AUTH_API_URL || API_URL;
const ORDERS_PATH = process.env.NEXT_PUBLIC_ORDERS_PATH || "/order";

async function fetchWithRetry(target: string, headers: Record<string, string>) {
  let res = await fetch(target, { method: "GET", headers });
  if (res.status === 429) {
    const ra = res.headers.get("retry-after");
    const wait = ra && /^\d+$/.test(ra) ? parseInt(ra, 10) * 1000 : 2200;
    await new Promise(r => setTimeout(r, wait));
    res = await fetch(target, { method: "GET", headers });
  }
  const text = await res.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { res, data };
}

export async function GET(req: Request): Promise<Response> {
  try {
    const token = readTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { message: "Authentication Required" },
        { status: 401 }
      );
    }

    const headers: Record<string, string> = {
      Accept: "application/json, text/plain, */*",
      Authorization: `Bearer ${token}`,
    };

    const bases = [
      `${CONTENT_API_URL}${ORDERS_PATH}`,
      `${API_URL}${ORDERS_PATH}`,
      `${AUTH_API_URL}${ORDERS_PATH}`,
      `${CONTENT_API_URL}/orders`,
      `${API_URL}/orders`,
      `${AUTH_API_URL}/orders`,
    ];

    let last: { status: number; data: any; target: string } | null = null;
    for (const target of bases) {
      const { res, data } = await fetchWithRetry(target, headers);
      if (res.ok) {
        const arr: any[] = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        const normalized = arr.map(o => {
          const statusRaw = o?.status;
          const status = String(statusRaw ?? "confirmado").toLowerCase();
          return { ...o, status };
        });
        return NextResponse.json({ data: normalized }, { status: 200 });
      }
      last = { status: res.status, data, target };
      if (res.status !== 404 && res.status !== 405) {
        return NextResponse.json(
          { data, target },
          { status: res.status }
        );
      }
    }
    const fallback = last ?? { status: 404, data: [] as any[], target: "" };
    const arr: any[] = Array.isArray(fallback.data?.data)
      ? fallback.data.data
      : Array.isArray(fallback.data)
      ? fallback.data
      : [];
    const normalized = arr.map(o => ({ ...o, status: "confirmado" }));
    return NextResponse.json({ data: normalized }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { message: "Unexpected error", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}