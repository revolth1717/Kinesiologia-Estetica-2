import { NextResponse } from "next/server";

const XANO_API_URL = process.env.XANO_API_URL ?? "https://x8ki-letl-twmt.n7.xano.io/api:-E-1dvfg";

export async function POST(req: Request): Promise<Response> {
  try {
    const payload = await req.json();
    const res = await fetch(`${XANO_API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    const token: string | undefined = (data as any)?.authToken;
    const userId = (data as any)?.user_id;
    const isProd = process.env.NODE_ENV === "production";
    const sameSite: "strict" | "lax" | "none" = isProd ? "none" : "lax";

    const out = NextResponse.json({ ok: true, user_id: userId });
    if (token) {
      out.cookies.set("authToken", token, {
        httpOnly: true,
        secure: isProd,
        sameSite,
        path: "/",
      });
    }
    return out;
  } catch (err) {
    return NextResponse.json({ error: "Error inesperado", detail: String(err) }, { status: 500 });
  }
}