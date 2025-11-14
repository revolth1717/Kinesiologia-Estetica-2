import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_URL ?? process.env.XANO_API_URL ?? "https://x8ki-letl-twmt.n7.xano.io/api:-E-1dvfg";

export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const paramToken = url.searchParams.get("token") || undefined;
    // Lee el token desde la cabecera Cookie manualmente para evitar incompatibilidades
    const cookieHeader = req.headers.get("cookie") || "";
    const cookieToken = (() => {
      const parts = cookieHeader.split(";");
      for (const part of parts) {
        const [k, v] = part.trim().split("=");
        if (k === "authToken" && v) return decodeURIComponent(v);
      }
      return undefined;
    })();
    const token = paramToken ?? cookieToken;
    if (!token) {
      return NextResponse.json({ message: "Authentication Required" }, { status: 401 });
    }

    const candidates = [
      `${AUTH_BASE}/auth/me`,
      `${process.env.XANO_API_URL ?? AUTH_BASE}/auth/me`,
    ];
    let res: Response | null = null;
    let body: any = null;
    for (const url of candidates) {
      const r = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json, text/plain, */*",
        },
      });
      const text = await r.text();
      try { body = JSON.parse(text); } catch { body = { raw: text }; }
      res = r;
      if (r.ok) break;
    }

    // Normalizar respuesta para exponer campos comunes en el nivel superior
    const normalized = (() => {
      const emailRaw = body?.email ?? body?.user?.email ?? body?.profile?.email;
      const nameRaw = body?.name ?? body?.nombre ?? body?.user?.name ?? body?.user?.nombre ?? body?.profile?.name ?? body?.profile?.nombre;
      const phoneRaw = body?.phone ?? body?.user?.phone ?? body?.profile?.phone ?? body?.phone_number ?? body?.user?.phone_number;
      const roleRaw = body?.role ?? body?.user?.role ?? body?.profile?.role ?? body?.roles ?? body?.user?.roles ?? body?.is_admin;
      return {
        id: body?.id ?? body?.user?.id ?? null,
        email: typeof emailRaw === 'string' ? emailRaw : (emailRaw ? String(emailRaw) : ''),
        name: typeof nameRaw === 'string' ? nameRaw : (nameRaw ? String(nameRaw) : ''),
        phone: typeof phoneRaw === 'string' ? phoneRaw : (phoneRaw ? String(phoneRaw) : ''),
        role: typeof roleRaw === 'string' ? roleRaw : (roleRaw ? String(roleRaw) : ''),
        raw: body,
      };
    })();

    let phoneResolved = normalized.phone || '';
    const uid = normalized.id;
    if ((phoneResolved.trim() === '') && uid) {
      const detailCandidates = [
        `${AUTH_BASE}/user/${uid}`,
        `${AUTH_BASE}/users/${uid}`,
        `${process.env.NEXT_PUBLIC_API_URL ?? ''}/user/${uid}`,
        `${process.env.NEXT_PUBLIC_API_URL ?? ''}/users/${uid}`,
        `${AUTH_BASE}/auth/details`,
      ].filter(Boolean);
      for (const target of detailCandidates) {
        try {
          const dr = await fetch(target, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json, text/plain, */*",
            },
          });
          const dtext = await dr.text();
          let dbody: any = null;
          try { dbody = JSON.parse(dtext); } catch { dbody = { raw: dtext }; }
          if (dr.ok) {
            const drPhoneRaw = dbody?.phone ?? dbody?.user?.phone ?? dbody?.profile?.phone ?? dbody?.phone_number ?? dbody?.user?.phone_number;
            const resolved = typeof drPhoneRaw === 'string' ? drPhoneRaw : (drPhoneRaw ? String(drPhoneRaw) : '');
            if (resolved && resolved.trim() !== '') {
              phoneResolved = resolved;
              break;
            }
          }
        } catch {}
      }
    }

    const final = { ...normalized, phone: phoneResolved };
    return NextResponse.json(final, { status: res?.status ?? 200 });
  } catch (err) {
    return NextResponse.json({ message: "Unexpected error", detail: String(err) }, { status: 500 });
  }
}