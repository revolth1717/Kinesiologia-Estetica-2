import { NextResponse } from "next/server";

export async function POST(): Promise<Response> {
  const res = NextResponse.json({ ok: true });
  // Borrar cookie en el dominio
  res.cookies.set("authToken", "", { path: "/", httpOnly: true, maxAge: 0 });
  return res;
}