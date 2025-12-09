import { NextResponse, NextRequest } from "next/server";

const CONTENT_API_URL = process.env.NEXT_PUBLIC_XANO_CONTENT_API || process.env.NEXT_PUBLIC_XANO_CONTENT_API || "https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V";
const ZONES_BY_TREATMENT_PATH = process.env.NEXT_PUBLIC_ZONES_BY_TREATMENT_PATH || "/zonas-por-tratamiento";

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "Missing 'id' query parameter" }, { status: 400 });
  }

  // Endpoint oficial proporcionado por usuario: /Listar_zonas_por_tratamiento
  const target = `${CONTENT_API_URL}/Listar_zonas_por_tratamiento?tratamiento_id=${id}`;

  try {
    const res = await fetch(target, { method: "GET", headers: { Accept: "application/json, text/plain, */*" } });
    const text = await res.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json({ message: "Upstream error", detail: data }, { status: res.status });
  } catch (err) {
    return NextResponse.json({ message: "Unexpected error", detail: String(err) }, { status: 500 });
  }
}