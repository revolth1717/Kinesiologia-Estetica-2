import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const XANO_API_URL = process.env.XANO_API_URL ?? "https://x8ki-letl-twmt.n7.xano.io/api:-E-1dvfg";

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
      try {
        const store = cookies();
        return store.get("authToken")?.value;
      } catch {
        return undefined;
      }
    })();
    const token = paramToken ?? cookieToken;
    if (!token) {
      return NextResponse.json({ message: "Authentication Required" }, { status: 401 });
    }

    const res = await fetch(`${XANO_API_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json, text/plain, */*",
      },
    });

    const text = await res.text();
    let body: any = null;
    try { body = JSON.parse(text); } catch { body = { raw: text }; }
    return NextResponse.json(body, { status: res.status });
  } catch (err) {
    return NextResponse.json({ message: "Unexpected error", detail: String(err) }, { status: 500 });
  }
}