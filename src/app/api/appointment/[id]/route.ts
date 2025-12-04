import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const clean = (s?: string) =>
  String(s || "")
    .trim()
    .replace(/^`+|`+$/g, "")
    .replace(/^"+|"+$/g, "");
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

export async function PATCH(
  req: Request,
  { params }: { params: any }
): Promise<Response> {
  try {
    const token = readTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { message: "Authentication Required" },
        { status: 401 }
      );
    }

    // Robustez: obtener id desde params o desde la URL
    const url = new URL(req.url);
    const path = url.pathname || ""; // ej: /api/appointment/15
    const segMatch = path.match(/\/appointment\/(\d+)/);
    const idFromPath = segMatch?.[1];
    const paramsMaybe: any = params;
    const paramsObj =
      paramsMaybe && typeof paramsMaybe.then === "function"
        ? await paramsMaybe
        : paramsMaybe;
    const idRaw = paramsObj?.id ?? idFromPath ?? "";
    const idStr = String(idRaw).trim();
    // Asegurar que el id sea un entero válido para Xano
    if (!/^\d+$/.test(idStr)) {
      return NextResponse.json(
        { message: "Invalid appointment id", detail: idStr },
        { status: 400 }
      );
    }

    const rawPayload = await req.json().catch(() => ({}));
    const normalizeStatus = (v: any): any => {
      if (typeof v !== "string") return v;
      const s = v.toLowerCase().trim();
      if (s === "confirmada" || s === "confirmed") return "CONFIRMADA";
      if (s === "pendiente" || s === "pending") return "PENDIENTE";
      if (s === "cancelada" || s === "cancelled" || s === "canceled")
        return "CANCELADA";
      return String(v).toUpperCase();
    };
    const toXanoInput = (v: any): any => {
      try {
        if (typeof v === "number") return v;
        const s = String(v || "").trim();
        if (/^\d+$/.test(s)) {
          const num = parseInt(s, 10);
          const ms = s.length >= 13 ? num : num * 1000;
          return ms;
        }
        return s;
      } catch {
        return v;
      }
    };
    const payload: any = { ...rawPayload };
    if ("status" in payload) payload.status = normalizeStatus(payload.status);
    if ("appointment_date" in payload)
      payload.appointment_date = toXanoInput(payload.appointment_date);

    if (payload && typeof payload.appointment_date !== "undefined") {
      const toDate = (v: any): Date => {
        try {
          if (typeof v === "number") return new Date(v);
          const s = String(v || "").trim();
          const ddmmyyyy = s.match(/^([0-9]{2})-([0-9]{2})-([0-9]{4})$/);
          if (ddmmyyyy) {
            const dd = parseInt(ddmmyyyy[1], 10);
            const mm = parseInt(ddmmyyyy[2], 10);
            const yy = parseInt(ddmmyyyy[3], 10);
            return new Date(yy, mm - 1, dd);
          }
          const yyyymmdd = s.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/);
          if (yyyymmdd) {
            const yy = parseInt(yyyymmdd[1], 10);
            const mm = parseInt(yyyymmdd[2], 10);
            const dd = parseInt(yyyymmdd[3], 10);
            return new Date(yy, mm - 1, dd);
          }
          if (/^\d+$/.test(s)) {
            const num = parseInt(s, 10);
            const ms = s.length >= 13 ? num : num * 1000;
            return new Date(ms);
          }
          return new Date(s);
        } catch {
          return new Date();
        }
      };
      const d = toDate(payload.appointment_date);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yy = String(d.getFullYear());
      const dmy = `${dd}-${mm}-${yy}`;
      const hhmm = `${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes()
      ).padStart(2, "0")}`;
      console.log("[proxy] reschedule compose", {
        id: idStr,
        input: payload.appointment_date,
        nueva_fecha: dmy,
        nueva_hora: hhmm,
      });
      const body = { nueva_fecha: dmy, nueva_hora: hhmm } as any;
      const target = `${XANO_AUTH}/appointment/reschedule/${encodeURIComponent(
        idStr
      )}`;
      const res = await fetch(target, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
      console.log("[proxy] reschedule response", {
        status: res.status,
        ok: res.ok,
        data,
      });
      if (res.ok) {
        return NextResponse.json(data, { status: res.status });
      }
      if (res.status !== 404 && res.status !== 405) {
        return NextResponse.json(data, { status: res.status });
      }
    }

    const isCancel =
      String(payload?.status || "").toUpperCase() === "CANCELADA";
    if (isCancel) {
      const cancelTargets = [
        `${XANO_AUTH}/appointment/user/${encodeURIComponent(idStr)}`,
        `${XANO_AUTH}/appointment/user/${encodeURIComponent(idStr)}/`,
        `${XANO_AUTH}/appointment/cancel/${encodeURIComponent(idStr)}`,
        `${XANO_AUTH}/appointment/cancel`,
        `${XANO_GENERAL}/appointment/cancel/${encodeURIComponent(idStr)}`,
        `${XANO_GENERAL}/appointment/cancel`,
      ];
      for (const target of cancelTargets) {
        const method = target.endsWith("/cancel") ? "POST" : "PATCH";
        const res = await fetch(target, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...payload, id: idStr }),
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
        // Continuar probando otros candidatos en caso de 403/400/404
      }
    }

    const updateTargets = [
      `${XANO_AUTH}/appointment/${encodeURIComponent(idStr)}`,
      `${XANO_GENERAL}/appointment/${encodeURIComponent(idStr)}`,
    ];
    const methods = ["PATCH", "PUT"] as const;
    let last: { status: number; data: any } | null = null;
    for (const target of updateTargets) {
      for (const method of methods) {
        const bodies: any[] = [
          payload,
          { input: payload },
          { appointment_id: parseInt(idStr, 10), ...payload },
        ];
        for (const body of bodies) {
          const res = await fetch(target, {
            method,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json, text/plain, */*",
            },
            body: JSON.stringify(body),
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
          if (res.status !== 404 && res.status !== 405) {
            // Si el endpoint existe pero falló por otra razón, devuelve el error
            return NextResponse.json(data, { status: res.status });
          }
        }
      }
    }

    if (isCancel) {
      const deleteTargets = [
        `${XANO_AUTH}/appointment/${encodeURIComponent(idStr)}`,
        `${XANO_GENERAL}/appointment/${encodeURIComponent(idStr)}`,
      ];
      for (const target of deleteTargets) {
        const res = await fetch(target, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await res.text();
        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch {
          data = { raw: text };
        }
        if (res.ok) {
          return NextResponse.json(data || { success: true }, {
            status: res.status,
          });
        }
        // Continuar probando otros candidatos
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

export async function DELETE(
  req: Request,
  { params }: { params: any }
): Promise<Response> {
  try {
    const token = readTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { message: "Authentication Required" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname || ""; // ej: /api/appointment/15
    const segMatch = path.match(/\/appointment\/(\d+)/);
    const idFromPath = segMatch?.[1];
    const paramsMaybeDel: any = params;
    const paramsObjDel =
      paramsMaybeDel && typeof paramsMaybeDel.then === "function"
        ? await paramsMaybeDel
        : paramsMaybeDel;
    const idRaw = paramsObjDel?.id ?? idFromPath ?? "";
    const idStr = String(idRaw).trim();
    if (!/^\d+$/.test(idStr)) {
      return NextResponse.json(
        { message: "Invalid appointment id", detail: idStr },
        { status: 400 }
      );
    }

    const candidates = [
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
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
      if (res.ok) {
        // Algunos endpoints devuelven vacío en DELETE: responder 204 o devolver data si la hay
        return NextResponse.json(data || { success: true }, {
          status: res.status,
        });
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
