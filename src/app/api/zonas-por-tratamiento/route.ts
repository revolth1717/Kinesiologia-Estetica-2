import { NextResponse, NextRequest } from "next/server";

const CONTENT_API_URL = process.env.NEXT_PUBLIC_XANO_CONTENT_API || "https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V";
const ZONES_BY_TREATMENT_PATH = process.env.NEXT_PUBLIC_ZONES_BY_TREATMENT_PATH || "/zonas-por-tratamiento";

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "Missing 'id' query parameter" }, { status: 400 });
  }

  const candidates = [
    `${CONTENT_API_URL}${ZONES_BY_TREATMENT_PATH}/${id}`,
    `${CONTENT_API_URL}/zonas-por-tratamiento/${id}`,
    `${CONTENT_API_URL}/zonas-por-tratamiento?id=${id}`,
    `${CONTENT_API_URL}/tratamientos/${id}/zonas`,
    `${CONTENT_API_URL}/zonas?tratamiento_id=${id}`,
    `${CONTENT_API_URL}/tratamientos/${id}`,
  ];

  let lastError: any = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: "GET", headers: { Accept: "application/json, text/plain, */*" } });
      const text = await res.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }

      if (res.ok) {
        return NextResponse.json(data, { status: res.status });
      }
      lastError = new Error(`Upstream ${res.status}`);
    } catch (err) {
      lastError = err;
    }
  }

  return NextResponse.json({ message: "No zones endpoint matched", detail: String(lastError) }, { status: 502 });
}