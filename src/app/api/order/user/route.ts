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

async function getMe(origin: string, cookieHeader: string): Promise<any> {
  const res = await fetch(`${origin}/api/auth/me`, { method: "GET", headers: { Accept: "application/json, text/plain, */*", Cookie: cookieHeader } });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

export async function GET(req: Request): Promise<Response> {
  try {
    const token = readTokenFromRequest(req);
    if (!token) return NextResponse.json({ message: "Authentication Required" }, { status: 401 });
    const cookieHeader = req.headers.get("cookie") || "";
    const url = new URL(req.url);
    const origin = url.origin;
    const me = await getMe(origin, cookieHeader);
    let userId = me?.id ?? me?.user?.id ?? me?.profile?.id ?? me?.user_id;
    if (!userId) {
      const email = me?.email ?? me?.user?.email ?? me?.profile?.email;
      if (email) {
        try {
          const usersRes = await fetch(`${origin}/api/users?role=member&q=${encodeURIComponent(String(email))}`, { method: "GET", headers: { Accept: "application/json, text/plain, */*", Cookie: cookieHeader } });
          const usersText = await usersRes.text();
          let usersData: any = null;
          try { usersData = JSON.parse(usersText); } catch { usersData = { raw: usersText }; }
          const arr = Array.isArray(usersData?.data) ? usersData.data : Array.isArray(usersData) ? usersData : [];
          const match = arr.find((u: any) => String(u?.email || "").trim().toLowerCase() === String(email).trim().toLowerCase());
          if (match && (match.id || match.user_id)) {
            userId = match.id ?? match.user_id;
          }
        } catch {}
      }
    }
    if (!userId) return NextResponse.json({ success: true, data: [] }, { status: 200 });

    const candidates = [
      `${CONTENT_API_URL}${ORDERS_PATH}/user`,
      `${API_URL}${ORDERS_PATH}/user`,
      `${CONTENT_API_URL}${ORDERS_PATH}?user_id=${encodeURIComponent(String(userId))}`,
      `${API_URL}${ORDERS_PATH}?user_id=${encodeURIComponent(String(userId))}`,
      `${CONTENT_API_URL}/orders?user_id=${encodeURIComponent(String(userId))}`,
      `${API_URL}/orders?user_id=${encodeURIComponent(String(userId))}`,
    ];

    let last: { status: number; data: any; target: string } | null = null;
    for (const target of candidates) {
      let res = await fetch(target, { method: "GET", headers: { Authorization: `Bearer ${token}`, Accept: "application/json, text/plain, */*" } });
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 2200));
        res = await fetch(target, { method: "GET", headers: { Authorization: `Bearer ${token}`, Accept: "application/json, text/plain, */*" } });
      }
      const text = await res.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
      if (res.ok) {
        const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : (Array.isArray(data?.records) ? data.records : []);
        return NextResponse.json({ success: true, data: list }, { status: 200 });
      }
      last = { status: res.status, data, target };
      if (res.status !== 404 && res.status !== 400) {
        return NextResponse.json(data, { status: res.status });
      }
    }

    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: "Unexpected error", detail: String(err?.message || err) }, { status: 500 });
  }
}