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

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.XANO_AUTH_API_URL || process.env.XANO_GENERAL_API_URL || "https://x8ki-letl-twmt.n7.xano.io/api:-E-1dvfg";
const CONTENT_API_URL = process.env.NEXT_PUBLIC_CONTENT_API_URL || process.env.NEXT_PUBLIC_API_URL || process.env.XANO_GENERAL_API_URL || API_URL;

export async function GET(req: Request, { params }: { params: { id: string } }): Promise<Response> {
  try {
    const token = readTokenFromRequest(req);
    if (!token) return NextResponse.json({ message: "Authentication Required" }, { status: 401 });
    const id = String(params?.id || "").trim();
    const candidates = [
      `${CONTENT_API_URL}/user/${encodeURIComponent(id)}`,
      `${API_URL}/user/${encodeURIComponent(id)}`,
      `${CONTENT_API_URL}/users/${encodeURIComponent(id)}`,
      `${API_URL}/users/${encodeURIComponent(id)}`,
    ];
    for (const target of candidates) {
      let res = await fetch(target, { method: "GET", headers: { Authorization: `Bearer ${token}`, Accept: "application/json, text/plain, */*" } });
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 2200));
        res = await fetch(target, { method: "GET", headers: { Authorization: `Bearer ${token}`, Accept: "application/json, text/plain, */*" } });
      }
      const text = await res.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
      if (res.ok) return NextResponse.json(data, { status: 200 });
      if (res.status !== 404) return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json({ message: "User endpoint not found" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ message: "Unexpected error", detail: String(err?.message || err) }, { status: 500 });
  }
}