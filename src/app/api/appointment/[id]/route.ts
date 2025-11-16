import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const clean = (s?: string) => String(s || "").trim().replace(/^`+|`+$/g, "").replace(/^"+|"+$/g, "");
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

export async function PATCH(req: Request, { params }: { params: { id: string } }): Promise<Response> {
  try {
    const token = readTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ message: "Authentication Required" }, { status: 401 });
    }

    // Robustez: obtener id desde params o desde la URL
    const url = new URL(req.url);
    const path = url.pathname || ""; // ej: /api/appointment/15
    const segMatch = path.match(/\/appointment\/(\d+)/);
    const idFromPath = segMatch?.[1];
    const idRaw = (params?.id ?? idFromPath ?? "");
    const idStr = String(idRaw).trim();
    // Asegurar que el id sea un entero válido para Xano
    if (!/^\d+$/.test(idStr)) {
      return NextResponse.json({ message: "Invalid appointment id", detail: idStr }, { status: 400 });
    }

    const rawPayload = await req.json().catch(() => ({}));
    const normalizeStatus = (v: any): any => {
      if (typeof v !== "string") return v;
      const s = v.toLowerCase().trim();
      if (s === "confirmada" || s === "confirmed") return "confirmada";
      if (s === "pendiente" || s === "pending") return "pendiente";
      if (s === "cancelada" || s === "cancelled" || s === "canceled") return "cancelada";
      return s;
    };
    const toIso = (v: any): any => {
      try {
        if (typeof v === "number") return new Date(v).toISOString();
        const s = String(v || "").trim();
        if (/^\d+$/.test(s)) {
          const num = parseInt(s, 10);
          const ms = s.length >= 13 ? num : num * 1000;
          return new Date(ms).toISOString();
        }
        return new Date(s).toISOString();
      } catch {
        return v;
      }
    };
    const payload: any = { ...rawPayload };
    if ("status" in payload) payload.status = normalizeStatus(payload.status);
    if ("appointment_date" in payload) payload.appointment_date = toIso(payload.appointment_date);
    const baseCandidates = [
      `${XANO_GENERAL}/appointment/${encodeURIComponent(idStr)}`,
      `${XANO_AUTH}/appointment/${encodeURIComponent(idStr)}`,
      `${XANO_GENERAL}/appointments/${encodeURIComponent(idStr)}`,
      `${XANO_AUTH}/appointments/${encodeURIComponent(idStr)}`,
      `${XANO_GENERAL}/citas/${encodeURIComponent(idStr)}`,
      `${XANO_AUTH}/citas/${encodeURIComponent(idStr)}`,
    ];
    let last: { status: number; data: any } | null = null;
    for (const target of baseCandidates) {
      // Intentar PATCH primero, luego PUT como fallback
      const methods = ["PATCH", "PUT"] as const;
      for (const method of methods) {
        const res = await fetch(target, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const text = await res.text();
        let data: any = null;
        try { data = JSON.parse(text); } catch { data = { raw: text }; }
        if (res.ok) {
          return NextResponse.json(data, { status: res.status });
        }
        last = { status: res.status, data };
        if (res.status !== 404 && res.status !== 405) {
          return NextResponse.json(data, { status: res.status });
        }
      }
    }
    const fallback = last ?? { status: 404, data: { message: "Not Found" } };
    return NextResponse.json(fallback.data, { status: fallback.status });
  } catch (err) {
    return NextResponse.json({ message: "Unexpected error", detail: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }): Promise<Response> {
  try {
    const token = readTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ message: "Authentication Required" }, { status: 401 });
    }

    const url = new URL(req.url);
    const path = url.pathname || ""; // ej: /api/appointment/15
    const segMatch = path.match(/\/appointment\/(\d+)/);
    const idFromPath = segMatch?.[1];
    const idRaw = (params?.id ?? idFromPath ?? "");
    const idStr = String(idRaw).trim();
    if (!/^\d+$/.test(idStr)) {
      return NextResponse.json({ message: "Invalid appointment id", detail: idStr }, { status: 400 });
    }

    const candidates = [
      `${XANO_GENERAL}/appointment/${encodeURIComponent(idStr)}`,
      `${XANO_AUTH}/appointment/${encodeURIComponent(idStr)}`,
    ];
    let last: { status: number; data: any } | null = null;
    for (const target of candidates) {
      const res = await fetch(target, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const text = await res.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
      if (res.ok) {
        // Algunos endpoints devuelven vacío en DELETE: responder 204 o devolver data si la hay
        return NextResponse.json(data || { success: true }, { status: res.status });
      }
      last = { status: res.status, data };
      if (res.status !== 404) {
        return NextResponse.json(data, { status: res.status });
      }
    }
    const fallback = last ?? { status: 404, data: { message: "Not Found" } };
    return NextResponse.json(fallback.data, { status: fallback.status });
  } catch (err) {
    return NextResponse.json({ message: "Unexpected error", detail: String(err) }, { status: 500 });
  }
}