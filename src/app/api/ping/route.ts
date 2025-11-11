import { NextResponse } from "next/server";

export async function GET(): Promise<Response> {
  const payload = {
    ok: true,
    route: "/api/ping",
    node: typeof process !== "undefined" ? process.version : "unknown",
    runtime: process.env.NODE_ENV || "unknown",
    env: {
      XANO_GENERAL_API_URL: process.env.XANO_GENERAL_API_URL || null,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || null,
      XANO_API_URL: process.env.XANO_API_URL || null,
      NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL || null,
      NEXT_PUBLIC_CONTENT_API_URL: process.env.NEXT_PUBLIC_CONTENT_API_URL || null,
    },
    expected_routes: [
      "/api/appointment/user",
      "/api/appointment",
      "/api/appointment/[id]",
    ],
  };

  return NextResponse.json(payload, { status: 200 });
}