import { NextResponse, NextRequest } from "next/server";

// Intentamos ambas bases de Xano por compatibilidad con tu configuración actual
const XANO_GENERAL_API_URL = process.env.XANO_GENERAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V";
const XANO_AUTH_API_URL = process.env.XANO_API_URL || process.env.NEXT_PUBLIC_AUTH_URL || "https://x8ki-letl-twmt.n7.xano.io/api:-E-1dvfg";

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const tz = searchParams.get("tz") || "America/Santiago";
    const service_id = searchParams.get("service_id");
    const professional_id = searchParams.get("professional_id");
    const branch_id = searchParams.get("branch_id");

    if (!date) {
      return NextResponse.json({ error: "Missing 'date' query parameter" }, { status: 400 });
    }

    const qs = new URLSearchParams();
    qs.set("date", date);
    if (tz) qs.set("tz", tz);
    if (service_id) qs.set("service_id", service_id);
    if (professional_id) qs.set("professional_id", professional_id);
    if (branch_id) qs.set("branch_id", branch_id);

    const candidates = [
      `${XANO_GENERAL_API_URL}/appointment/availability?${qs.toString()}`,
      `${XANO_GENERAL_API_URL}/availability?${qs.toString()}`,
      `${XANO_GENERAL_API_URL}/get_taken_times?${qs.toString()}`,
      `${XANO_AUTH_API_URL}/appointment/availability?${qs.toString()}`,
      `${XANO_AUTH_API_URL}/availability?${qs.toString()}`,
      `${XANO_AUTH_API_URL}/get_taken_times?${qs.toString()}`,
    ];

    let lastError: any = null;
    for (const url of candidates) {
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json, text/plain, */*" },
        });
        const text = await res.text();
        let data: any = null;
        try { data = JSON.parse(text); } catch { data = { raw: text }; }

        if (res.ok) {
          // Normalizamos a { taken_times: string[] }
          const taken = Array.isArray((data as any)?.taken_times)
            ? (data as any).taken_times
            : Array.isArray(data)
              ? data
              : [];
          return NextResponse.json({ taken_times: taken, source: url }, { status: 200 });
        }
        lastError = new Error(`Upstream ${res.status}`);
      } catch (err) {
        lastError = err;
      }
    }

    return NextResponse.json({ error: "No availability endpoint responded", detail: String(lastError) }, { status: 502 });
  } catch (err) {
    return NextResponse.json({ error: "Unexpected error", detail: String(err) }, { status: 500 });
  }
}