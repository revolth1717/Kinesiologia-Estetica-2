import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const clean = (s?: string) => String(s || "").trim().replace(/^`+|`+$/g, "").replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, "");
const XANO_GENERAL = clean(process.env.XANO_GENERAL_API_URL) || clean(process.env.NEXT_PUBLIC_API_URL) || "https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V";
const XANO_AUTH = clean(process.env.XANO_AUTH_API_URL) || clean(process.env.NEXT_PUBLIC_AUTH_URL) || "https://x8ki-letl-twmt.n7.xano.io/api:-E-1dvfg";

function readTokenFromRequest(req: Request): string | undefined {
  const cookieHeader = req.headers.get("cookie") || "";
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [k, v] = part.trim().split("=");
    if (k === "authToken" && v) return decodeURIComponent(v);
  }
  try {
    const store = cookies();
    return store.get("authToken")?.value;
  } catch {
    return undefined;
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }): Promise<Response> {
  try {
    const token = readTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ message: "Authentication Required" }, { status: 401 });
    }

    const url = new URL(req.url);
    const path = url.pathname || ""; // ej: /api/user/15
    const segMatch = path.match(/\/user\/(\d+)/);
    const idFromPath = segMatch?.[1];
    const idRaw = (params?.id ?? idFromPath ?? "");
    const idStr = String(idRaw).trim();
    if (!/^\d+$/.test(idStr)) {
      return NextResponse.json({ message: "Invalid user id", detail: idStr }, { status: 400 });
    }

    const candidates = [
      `${XANO_AUTH}/user/${encodeURIComponent(idStr)}`,
      `${XANO_AUTH}/users/${encodeURIComponent(idStr)}`,
      `${XANO_GENERAL}/user/${encodeURIComponent(idStr)}`,
      `${XANO_GENERAL}/users/${encodeURIComponent(idStr)}`,
    ];

    let last: { status: number; data: any; target: string } | null = null;
    for (const target of candidates) {
      const res = await fetch(target, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json, text/plain, */*",
        },
      });
      const text = await res.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
      if (res.ok) {
        return NextResponse.json(data, { status: res.status });
      }
      last = { status: res.status, data, target };
      if (res.status !== 404) {
        return NextResponse.json(data, { status: res.status });
      }
    }

    const fallback = last ?? { status: 404, data: { message: "Not Found" }, target: candidates[candidates.length - 1] };
    return NextResponse.json(fallback.data, { status: fallback.status });
  } catch (err) {
    return NextResponse.json({ message: "Unexpected error", detail: String(err) }, { status: 500 });
  }
}