import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const XANO_API_BASE = process.env.XANO_GENERAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V";

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

    const target = `${XANO_API_BASE}/appointment/user`;
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
    if (debug) {
      return NextResponse.json({ data, debug: { upstreamStatus: res.status, target } }, { status: res.status });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ message: "Unexpected error", detail: String(err) }, { status: 500 });
  }
}