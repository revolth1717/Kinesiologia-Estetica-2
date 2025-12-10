import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const clean = (s?: string) =>
  String(s || "")
    .trim()
    .replace(/^`+|`+$/g, "")
    .replace(/^"+|"+$/g, "")
    .replace(/^'+|'+$/g, "");
const XANO_GENERAL =
  clean(process.env.NEXT_PUBLIC_XANO_CONTENT_API) ||
  clean(process.env.NEXT_PUBLIC_XANO_CONTENT_API) ||
  "https://x1xv-egpg-1mua.b2.xano.io/api:SzJNIj2V";
const XANO_AUTH =
  clean(process.env.NEXT_PUBLIC_XANO_AUTH_API) ||
  clean(process.env.NEXT_PUBLIC_XANO_AUTH_API) ||
  "https://x1xv-egpg-1mua.b2.xano.io/api:-E-1dvfg";

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

export async function POST(req: Request): Promise<Response> {
  try {
    const token = readTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { message: "Authentication Required" },
        { status: 401 }
      );
    }
    const payload = await req.json();
    const target = `${XANO_AUTH}/appointment`;
    const res = await fetch(target, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { message: "Unexpected error", detail: String(err) },
      { status: 500 }
    );
  }
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
    const url = new URL(req.url);
    const debug = url.searchParams.get("debug") === "1";

    const target = `${XANO_AUTH}/appointment`;
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
      return NextResponse.json(
        { data, debug: { upstreamStatus: res.status, target } },
        { status: res.status }
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { message: "Unexpected error", detail: String(err) },
      { status: 500 }
    );
  }
}
