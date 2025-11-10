import { NextResponse } from "next/server";

const XANO_API_URL = process.env.XANO_API_URL ?? "https://x8ki-letl-twmt.n7.xano.io/api:-E-1dvfg";

export async function POST(req: Request): Promise<Response> {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Faltan credenciales" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const res = await fetch(`${XANO_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return new Response(JSON.stringify(data || { error: "Login fallido" }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token: string | undefined = (data as any)?.authToken;
    const userId = (data as any)?.user_id;
    if (!token) {
      return new Response(JSON.stringify({ error: "Xano no devolvió authToken" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const isProd = process.env.NODE_ENV === "production";
    const sameSite: "strict" | "lax" | "none" = isProd ? "none" : "lax";

    const resOut = NextResponse.json({ ok: true, user_id: userId });
    resOut.cookies.set("authToken", token, {
      httpOnly: true,
      secure: isProd,
      sameSite,
      path: "/",
    });
    return resOut;
  } catch (err) {
    return new Response(JSON.stringify({ error: "Error inesperado", detail: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}