import { NextResponse } from "next/server";

const AUTH_BASE = process.env.NEXT_PUBLIC_XANO_AUTH_API ?? "https://x8ki-letl-twmt.n7.xano.io/api:-E-1dvfg";

interface UserProfile {
  id?: number | string;
  name?: string;
  nombre?: string;
  email?: string;
  phone?: string;
  phone_number?: string;
  role?: string;
  roles?: string;
  is_admin?: boolean;
  [key: string]: unknown;
}

interface AuthResponse {
  id?: number | string;
  user_id?: number | string;
  email?: string;
  name?: string;
  nombre?: string;
  phone?: string;
  phone_number?: string;
  role?: string;
  roles?: string;
  is_admin?: boolean;
  user?: UserProfile;
  profile?: UserProfile;
  [key: string]: unknown;
}

export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const paramToken = url.searchParams.get("token") || undefined;

    // Lee el token desde la cabecera Cookie manualmente
    const cookieHeader = req.headers.get("cookie") || "";
    const cookieToken = (() => {
      const parts = cookieHeader.split(";");
      for (const part of parts) {
        const [k, v] = part.trim().split("=");
        if (k === "authToken" && v) return decodeURIComponent(v);
      }
      return undefined;
    })();

    // Try from Authorization header
    const authHeader = req.headers.get("authorization");
    let headerToken: string | undefined;
    if (authHeader?.startsWith("Bearer ")) {
      headerToken = authHeader.substring(7);
    }

    const token = paramToken ?? headerToken ?? cookieToken;

    if (!token) {
      return NextResponse.json(
        { message: "Authentication Required" },
        { status: 401 }
      );
    }

    const candidates = [
      `${AUTH_BASE}/auth/me`,
    ];

    let res: Response | null = null;
    let body: AuthResponse | null = null;

    for (const endpoint of candidates) {
      try {
        const r = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (r.ok) {
          res = r;
          body = await r.json() as AuthResponse;
          break;
        }

        // Si falla, guardamos la respuesta por si es el último intento
        res = r;
        try {
          const text = await r.text();
          body = JSON.parse(text);
        } catch {
          body = null;
        }

      } catch (e) {
        console.error(`Error fetching ${endpoint}`, e);
      }
    }

    if (!body) {
      return NextResponse.json({ message: "Failed to fetch user data" }, { status: 500 });
    }

    // Normalizar respuesta
    const emailRaw = body.email ?? body.user?.email ?? body.profile?.email;
    const nameRaw =
      body.name ??
      body.nombre ??
      body.user?.name ??
      body.user?.nombre ??
      body.profile?.name ??
      body.profile?.nombre;

    const phoneRaw =
      body.phone ??
      body.user?.phone ??
      body.profile?.phone ??
      body.phone_number ??
      body.user?.phone_number;

    const roleRaw =
      body.role ??
      body.user?.role ??
      body.profile?.role ??
      body.roles ??
      body.user?.roles ??
      (body.is_admin ? "admin" : undefined);

    const normalized = {
      id: body.id ?? body.user?.id ?? body.user_id ?? null,
      email: String(emailRaw || ""),
      name: String(nameRaw || ""),
      phone: String(phoneRaw || ""),
      role: String(roleRaw || ""),
      raw: body,
    };

    // Si falta el teléfono, intentar buscar detalles adicionales
    let phoneResolved = normalized.phone;
    const uid = normalized.id;

    if (!phoneResolved && uid) {
      const detailCandidates = [
        `${AUTH_BASE}/user/${uid}`,
        `${AUTH_BASE}/users/${uid}`,
        `${AUTH_BASE}/auth/details`,
      ].filter(Boolean);

      for (const target of detailCandidates) {
        try {
          const dr = await fetch(target, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          });

          if (dr.ok) {
            const dbody = await dr.json() as AuthResponse;
            const drPhoneRaw =
              dbody.phone ??
              dbody.user?.phone ??
              dbody.profile?.phone ??
              dbody.phone_number ??
              dbody.user?.phone_number;

            if (drPhoneRaw) {
              phoneResolved = String(drPhoneRaw);
              break;
            }
          }
        } catch { }
      }
    }

    return NextResponse.json({ ...normalized, phone: phoneResolved }, { status: res?.status ?? 200 });

  } catch (err) {
    return NextResponse.json(
      { message: "Unexpected error", detail: String(err) },
      { status: 500 }
    );
  }
}