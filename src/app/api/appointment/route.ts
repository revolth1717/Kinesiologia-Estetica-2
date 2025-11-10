import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const XANO_API_BASE = process.env.XANO_GENERAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V";

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

export async function POST(req: Request): Promise<Response> {
  try {
    const token = readTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ message: "Authentication Required" }, { status: 401 });
    }

    const payload = await req.json();
    const res = await fetch(`${XANO_API_BASE}/appointment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ message: "Unexpected error", detail: String(err) }, { status: 500 });
  }
}