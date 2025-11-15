import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const clean = (s?: string) =>
  String(s || "")
    .trim()
    .replace(/^`+|`+$/g, "")
    .replace(/^"+|"+$/g, "")
    .replace(/^'+|'+$/g, "");
const XANO_GENERAL =
  clean(process.env.XANO_GENERAL_API_URL) ||
  clean(process.env.NEXT_PUBLIC_API_URL) ||
  "https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V";
const XANO_AUTH =
  clean(process.env.XANO_AUTH_API_URL) ||
  clean(process.env.NEXT_PUBLIC_AUTH_URL) ||
  "https://x8ki-letl-twmt.n7.xano.io/api:-E-1dvfg";

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
    const candidates = [
      `${XANO_GENERAL}/appointment`,
      `${XANO_AUTH}/appointment`,
    ];

    let last: { status: number; data: any } | null = null;
    for (const target of candidates) {
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
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
      if (res.ok) {
        return NextResponse.json(data, { status: res.status });
      }
      last = { status: res.status, data };
      if (res.status !== 404) {
        return NextResponse.json(data, { status: res.status });
      }
    }
    const fallback = last ?? { status: 404, data: { message: "Not Found" } };
    return NextResponse.json(fallback.data, { status: fallback.status });
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

    const candidates = [
      `${XANO_GENERAL}/appointment`,
      `${XANO_AUTH}/appointment`,
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
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
      if (res.ok) {
        if (debug) {
          return NextResponse.json(
            { data, debug: { upstreamStatus: res.status, target } },
            { status: res.status }
          );
        }
        return NextResponse.json(data, { status: res.status });
      }
      last = { status: res.status, data, target } as any;
      if (res.status !== 404) {
        if (debug) {
          return NextResponse.json(
            { data, debug: { upstreamStatus: res.status, target } },
            { status: res.status }
          );
        }
        return NextResponse.json(data, { status: res.status });
      }
    }

    const fallback =
      last ??
      ({
        status: 404,
        data: { message: "Not Found" },
        target: candidates[candidates.length - 1],
      } as any);
    if (debug) {
      return NextResponse.json(
        {
          data: (fallback as any).data,
          debug: {
            upstreamStatus: (fallback as any).status,
            target: (fallback as any).target,
          },
        },
        { status: (fallback as any).status }
      );
    }
    return NextResponse.json((fallback as any).data, {
      status: (fallback as any).status,
    });
  } catch (err) {
    return NextResponse.json(
      { message: "Unexpected error", detail: String(err) },
      { status: 500 }
    );
  }
}
