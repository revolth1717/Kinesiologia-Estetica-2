import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const clean = (s?: string) =>
  String(s || "")
    .trim()
    .replace(/^`+|`+$/g, "")
    .replace(/^"+|"+$/g, "")
    .replace(/^'+|'+$/g, "");
const XANO_AUTH =
  clean(process.env.XANO_AUTH_API_URL) ||
  clean(process.env.NEXT_PUBLIC_AUTH_URL) ||
  "https://x8ki-letl-twmt.n7.xano.io/api:-E-1dvfg";

async function readTokenFromRequest(req: Request): Promise<string | undefined> {
  const cookieHeader = req.headers.get("cookie") || "";
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [k, v] = part.trim().split("=");
    if (k === "authToken" && v) return decodeURIComponent(v);
  }
  try {
    const store = await cookies();
    return store.get("authToken")?.value;
  } catch {
    return undefined;
  }
}

export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const date = (url.searchParams.get("date") || "").trim(); // YYYY-MM-DD
    const tz = (url.searchParams.get("tz") || "America/Santiago").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { message: "Invalid date format" },
        { status: 400 }
      );
    }

    const token = await readTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ taken_times: [] }, { status: 200 });
    }

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
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    const arr: any[] = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

    const fmtDate = new Intl.DateTimeFormat("es-CL", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const fmtTime = new Intl.DateTimeFormat("es-CL", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const toDate = (v: any): Date => {
      try {
        if (typeof v === "number") return new Date(v);
        const s = String(v || "").trim();
        if (/^\d+$/.test(s)) {
          const num = parseInt(s, 10);
          const ms = s.length >= 13 ? num : num * 1000;
          return new Date(ms);
        }
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
        return new Date(s);
      } catch {
        return new Date();
      }
    };

    const takenTimes: string[] = [];
    for (const it of arr) {
      const statusRaw = it?.status;
      const status =
        typeof statusRaw === "string"
          ? statusRaw.toLowerCase().trim()
          : String(statusRaw || "").toLowerCase();
      if (
        status !== "confirmada" &&
        status !== "confirmed" &&
        status !== "CONFIRMADA".toLowerCase() &&
        status !== "pendiente" &&
        status !== "pending"
      )
        continue;
      const d = toDate(it?.appointment_date);
      const dparts = fmtDate.formatToParts(d);
      const yy = dparts.find(p => p.type === "year")?.value || "";
      const mm = dparts.find(p => p.type === "month")?.value || "";
      const dd = dparts.find(p => p.type === "day")?.value || "";
      const ymd = `${yy}-${mm}-${dd}`;
      if (ymd !== date) continue;
      const tparts = fmtTime.formatToParts(d);
      const h = tparts.find(p => p.type === "hour")?.value || "";
      const m = tparts.find(p => p.type === "minute")?.value || "";
      const hhmm = `${h}:${m}`;
      takenTimes.push(hhmm);
    }
    const unique = Array.from(new Set(takenTimes.sort()));
    return NextResponse.json({ taken_times: unique }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { taken_times: [], detail: String(err) },
      { status: 200 }
    );
  }
}
