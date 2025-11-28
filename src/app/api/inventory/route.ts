import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const clean = (s?: string) =>
  String(s || "")
    .trim()
    .replace(/^`+|`+$/g, "")
    .replace(/^"+|"+$/g, "")
    .replace(/^'+|'+$/g, "");
// Force the general group for inventory as per user setup
const XANO_GENERAL = "https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V";
const XANO_AUTH =
  clean(process.env.NEXT_PUBLIC_XANO_AUTH_API) ||
  clean(process.env.NEXT_PUBLIC_XANO_AUTH_API) ||
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

async function ensureAdmin(req: Request, token: string | undefined): Promise<boolean> {
  try {
    const url = new URL(req.url);
    const cookieHeader = req.headers.get("cookie") || "";
    const res = await fetch(`${url.origin}/api/auth/me`, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        Cookie: cookieHeader,
      },
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    if (!res.ok) return false;
    const roleRaw =
      data?.role ?? data?.user?.role ?? data?.profile?.role ?? data?.roles ?? data?.user?.roles;
    const isAdminFlag = data?.is_admin ?? data?.user?.is_admin ?? data?.profile?.is_admin;
    const roleStr = typeof roleRaw === "string" ? roleRaw.toLowerCase() : String(roleRaw || "").toLowerCase();
    const hasAdminRole = roleStr.includes("admin") || roleStr === "administrador";
    return Boolean(isAdminFlag) || hasAdminRole;
  } catch {
    return false;
  }
}

export async function GET(req: Request): Promise<Response> {
  try {
    const token = readTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ message: "Authentication Required" }, { status: 401 });
    }
    const url = new URL(req.url);
    const debug = url.searchParams.get("debug") === "1";

    const upstreamURL = new URL(`${XANO_GENERAL}/inventory`);
    url.searchParams.forEach((value, key) => {
      if (key !== "debug") upstreamURL.searchParams.set(key, value);
    });
    const target = upstreamURL.toString();
    const headers: Record<string, string> = {
      Accept: "application/json, text/plain, */*",
      Authorization: `Bearer ${token}`,
    };

    const res = await fetch(target, { method: "GET", headers });
    const text = await res.text();
    let data: unknown = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text } as unknown;
    }
    if (res.ok) {
      if (debug) {
        return NextResponse.json(
          { data, debug: { upstreamStatus: res.status, target, upstreamText: text } },
          { status: res.status }
        );
      }
      return NextResponse.json(data as any, { status: res.status });
    }
    if (res.status === 404) {
      if (debug) {
        return NextResponse.json(
          { data: [], debug: { upstreamStatus: res.status, target, upstreamText: text } },
          { status: 200 }
        );
      }
      return NextResponse.json([], { status: 200 });
    }
    if (debug) {
      return NextResponse.json(
        { data, debug: { upstreamStatus: res.status, target, upstreamText: text } },
        { status: res.status }
      );
    }
    return NextResponse.json(data as any, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { message: "Unexpected error", detail: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const token = readTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ message: "Authentication Required" }, { status: 401 });
    }
    const incoming = await req.json();
    const productName = String(incoming?.product_name ?? "").trim();
    const entry = Number(incoming?.entry ?? 0) || 0;
    const exit = Number(incoming?.exit ?? 0) || 0;

    // Upsert: try to update existing record by product_name, else create
    const listRes = await fetch(`${XANO_GENERAL}/inventory`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json, text/plain, */*",
      },
    });
    const listText = await listRes.text();
    let listData: any = [];
    try {
      listData = JSON.parse(listText);
    } catch {
      listData = [];
    }
    const arr: any[] = Array.isArray(listData)
      ? listData
      : Array.isArray(listData?.data)
      ? listData.data
      : [];
    const candidates = arr.filter((x) => String(x?.product_name ?? "").trim() === productName);
    const target = `${XANO_GENERAL}/inventory`;

    if (productName && candidates.length > 0) {
      // Choose the most recent by created_at or highest id
      const sorted = candidates
        .slice()
        .sort((a, b) => Number(b?.created_at ?? 0) - Number(a?.created_at ?? 0) || Number(b?.id ?? 0) - Number(a?.id ?? 0));
      const current = sorted[0];
      const prevStock = Number(current?.current_stock ?? 0) || 0;
      const nextStock = Math.max(0, prevStock + entry - exit);
      const updateBody = {
        product_name: productName,
        entry,
        exit,
        current_stock: nextStock,
        record_date: incoming?.record_date ?? new Date().toISOString(),
      };
      // Try PUT first, fallback to PATCH
      const putRes = await fetch(`${target}/${current.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateBody),
      });
      const putText = await putRes.text();
      let putData: unknown = null;
      try {
        putData = JSON.parse(putText);
      } catch {
        putData = { raw: putText } as unknown;
      }
      if (!putRes.ok && (putRes.status === 404 || putRes.status === 405)) {
        const patchRes = await fetch(`${target}/${current.id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateBody),
        });
        const patchText = await patchRes.text();
        let patchData: unknown = null;
        try {
          patchData = JSON.parse(patchText);
        } catch {
          patchData = { raw: patchText } as unknown;
        }
        return NextResponse.json(patchData as any, { status: patchRes.status });
      }
      return NextResponse.json(putData as any, { status: putRes.status });
    }

    // Create new if no existing record found
    const createBody = {
      product_name: productName || incoming?.product_name,
      entry,
      exit,
      current_stock: Number(incoming?.current_stock ?? entry - exit) || 0,
      record_date: incoming?.record_date ?? new Date().toISOString(),
    };
    const createRes = await fetch(target, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createBody),
    });
    const createText = await createRes.text();
    let createData: unknown = null;
    try {
      createData = JSON.parse(createText);
    } catch {
      createData = { raw: createText } as unknown;
    }
    return NextResponse.json(createData as any, { status: createRes.status });
  } catch (err) {
    return NextResponse.json(
      { message: "Unexpected error", detail: String(err) },
      { status: 500 }
    );
  }
}