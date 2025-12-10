import { NextResponse, NextRequest } from "next/server";
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

type UserLite = { id?: string | number; nombre?: string; email?: string; phone?: string; role?: string };

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const now = Date.now();
    const ttlMs = 10000;
    if ((global as any).__USERS_CACHE && now - (global as any).__USERS_CACHE_AT < ttlMs) {
      const cached = (global as any).__USERS_CACHE;
      return NextResponse.json({ success: true, data: cached }, { status: 200 });
    }
    const token = readTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ message: "Authentication Required" }, { status: 401 });
    }

    const url = new URL(req.url);
    const roleFilter = (url.searchParams.get("role") || "member").toLowerCase();
    const q = (url.searchParams.get("q") || "").trim();

    const bases = [
      `${XANO_AUTH}/users`,
      `${XANO_GENERAL}/users`,
      `${XANO_AUTH}/user`,
      `${XANO_GENERAL}/user`,
      `${XANO_AUTH}/auth/users`,
      `${XANO_GENERAL}/auth/users`,
      `${XANO_AUTH}/user/list`,
      `${XANO_GENERAL}/user/list`,
      `${XANO_AUTH}/users/list`,
      `${XANO_GENERAL}/users/list`,
      `${XANO_AUTH}/accounts`,
      `${XANO_GENERAL}/accounts`,
      `${XANO_AUTH}/account/list`,
      `${XANO_GENERAL}/account/list`,
    ];
    const candidates = bases.map(b => {
      const u = new URL(b);
      // Añadir filtros comunes si el backend los soporta
      if (roleFilter) u.searchParams.set("role", roleFilter);
      if (q) {
        u.searchParams.set("q", q);
        u.searchParams.set("search", q);
        u.searchParams.set("name", q);
        u.searchParams.set("nombre", q);
      }
      return u.toString();
    });

    let last: { status: number; data: any } | null = null;
    for (const target of candidates) {
      try {
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
          const arr: any[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
          const normalized: UserLite[] = arr.map((u: any) => {
            const roleRaw = u?.role ?? u?.rank ?? u?.type ?? u?.group ?? u?.roles;
            let roleStr: string | undefined = undefined;
            if (typeof roleRaw === "string") roleStr = roleRaw.toLowerCase();
            else if (Array.isArray(roleRaw)) {
              const r = roleRaw.map((x: unknown) => String(x || "").toLowerCase());
              roleStr = r.join(",");
            } else if (typeof roleRaw === "boolean") roleStr = roleRaw ? "admin" : "member";
            const nombreRaw = u?.name ?? u?.nombre ?? u?.full_name;
            const emailRaw = u?.email ?? u?.mail;
            const phoneRaw = u?.phone ?? u?.phone_number ?? u?.telefono;
            return {
              id: u?.id ?? u?.uuid ?? undefined,
              nombre: typeof nombreRaw === "string" ? nombreRaw : nombreRaw ? String(nombreRaw) : undefined,
              email: typeof emailRaw === "string" ? emailRaw : emailRaw ? String(emailRaw) : undefined,
              phone: typeof phoneRaw === "string" ? phoneRaw : phoneRaw ? String(phoneRaw) : undefined,
              role: roleStr,
            } as UserLite;
          });
          const filtered = normalized.filter(u => {
            const r = (u.role || "").toLowerCase();
            if (roleFilter === "member") {
              if (!r) return false;
              if (r.includes("admin")) return false;
              return r.includes("member") || r === "cliente" || r.includes("cliente");
            }
            return true;
          }).filter(u => {
            if (!q) return true;
            const name = (u.nombre || "").toLowerCase();
            return name.includes(q.toLowerCase());
          });
          (global as any).__USERS_CACHE = filtered;
          (global as any).__USERS_CACHE_AT = Date.now();
          return NextResponse.json({ success: true, data: filtered }, { status: 200 });
        }
        last = { status: res.status, data };
        if (res.status !== 404) {
          return NextResponse.json({ success: false, error: "Upstream error", data }, { status: res.status });
        }
      } catch (err: any) {
        last = { status: 500, data: { message: String(err) } };
      }
    }

    const empty: UserLite[] = [];
    const filtered = q ? empty.filter(u => (u.nombre || "").toLowerCase().includes(q.toLowerCase())) : empty;
    return NextResponse.json({ success: true, data: filtered, note: "No upstream matched" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Unexpected error", message: String(err) }, { status: 500 });
  }
}
