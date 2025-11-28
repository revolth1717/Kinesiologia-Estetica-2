import { NextResponse } from "next/server";

// Usa la URL pública configurada para contenido y el path de tratamientos
const CONTENT_API_URL = process.env.NEXT_PUBLIC_XANO_CONTENT_API || "https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V";
const TREATMENTS_PATH = process.env.NEXT_PUBLIC_TREATMENTS_PATH || "/tratamientos";

export async function GET(): Promise<Response> {
  try {
    const res = await fetch(`${CONTENT_API_URL}${TREATMENTS_PATH}`, {
      method: "GET",
      headers: { Accept: "application/json, text/plain, */*" },
    });

    const text = await res.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ message: "Unexpected error", detail: String(err) }, { status: 500 });
  }
}