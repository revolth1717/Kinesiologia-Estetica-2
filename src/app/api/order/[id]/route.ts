import { NextResponse } from "next/server";

function readTokenFromRequest(req: Request): string | undefined {
  const cookieHeader = req.headers.get("cookie") || "";
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [k, v] = part.trim().split("=");
    if (k === "authToken" && v) return decodeURIComponent(v);
  }
  try {
    const { cookies } = require("next/headers");
    const store = cookies();
    return store.get("authToken")?.value;
  } catch {
    return undefined;
  }
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.XANO_GENERAL_API_URL ||
  process.env.XANO_AUTH_API_URL ||
  "https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V";
const CONTENT_API_URL =
  process.env.NEXT_PUBLIC_CONTENT_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.XANO_GENERAL_API_URL ||
  API_URL;
const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_URL || process.env.XANO_AUTH_API_URL || API_URL;
const ORDERS_PATH = process.env.NEXT_PUBLIC_ORDERS_PATH || "/order";

export async function PATCH(
  req: Request,
  { params }: { params: any }
): Promise<Response> {
  try {
    const paramsMaybe: any = params;
    const paramsObj =
      paramsMaybe && typeof paramsMaybe.then === "function"
        ? await paramsMaybe
        : paramsMaybe;
    const id = String(paramsObj?.id || "").trim();
    const body = await req.json().catch(() => ({}));
    const idNum = /^\d+$/.test(id) ? Number(id) : id;
    const status = body?.status ?? "entregado";
    const endpoints = [
      `${API_URL}/order`,
      `${AUTH_API_URL}/order`,
      `${CONTENT_API_URL}/order`,
    ];
    const payload = { input: { order_id: idNum, status } };
    const tried: string[] = [];
    for (const target of endpoints) {
      tried.push(target);
      let res = await fetch(target, {
        method: "PATCH",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 2200));
        res = await fetch(target, {
          method: "PATCH",
          headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }
      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
      if (res.ok) return NextResponse.json(data, { status: 200 });
      if (res.status !== 404)
        return NextResponse.json({ ...data, target }, { status: res.status });
    }
    return NextResponse.json(
      { message: "Order endpoint not found", tried },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { message: "Unexpected error", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}
