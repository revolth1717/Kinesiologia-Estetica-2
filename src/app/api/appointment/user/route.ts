import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const clean = (s?: string) => String(s || "").trim().replace(/^`+|`+$/g, "").replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, "");
const XANO_GENERAL = clean(process.env.NEXT_PUBLIC_XANO_CONTENT_API) || clean(process.env.NEXT_PUBLIC_XANO_CONTENT_API) || "https://x1xv-egpg-1mua.b2.xano.io/api:SzJNIj2V";
const XANO_AUTH = clean(process.env.NEXT_PUBLIC_XANO_AUTH_API) || clean(process.env.NEXT_PUBLIC_XANO_AUTH_API) || "https://x1xv-egpg-1mua.b2.xano.io/api:-E-1dvfg";

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

export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const debug = url.searchParams.get("debug") === "1";
    const token = readTokenFromRequest(req);
    if (!token) {
      const body = debug
        ? { message: "Authentication Required", debug: { hasToken: false } }
        : { message: "Authentication Required" };
      return NextResponse.json(body, { status: 401 });
    }

    const candidates = [
      `${XANO_GENERAL}/appointment/user`,
      `${XANO_AUTH}/appointment/user`,
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
        if (debug) {
          return NextResponse.json({ data, debug: { upstreamStatus: res.status, target } }, { status: res.status });
        }
        return NextResponse.json(data, { status: res.status });
      }
      last = { status: res.status, data, target };
      if (res.status !== 404) {
        if (debug) {
          return NextResponse.json({ data, debug: { upstreamStatus: res.status, target } }, { status: res.status });
        }
        return NextResponse.json(data, { status: res.status });
      }
    }

    const fallback = last ?? { status: 404, data: { message: "Not Found" }, target: candidates[candidates.length - 1] };
    if (debug) {
      return NextResponse.json({ data: fallback.data, debug: { upstreamStatus: fallback.status, target: fallback.target } }, { status: fallback.status });
    }
    return NextResponse.json(fallback.data, { status: fallback.status });
  } catch (err) {
    return NextResponse.json({ message: "Unexpected error", detail: String(err) }, { status: 500 });
  }
}
