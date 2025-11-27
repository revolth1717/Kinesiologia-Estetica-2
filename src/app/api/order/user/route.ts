import { NextResponse } from "next/server";

// Orders endpoint uses a different API than auth
const API_URL = "https://x8ki-letl-twmt.n7.xano.io/api:-E-1dvfg";
const ORDERS_PATH = "/order";

export async function GET(req: Request): Promise<Response> {
  try {
    console.log("🔍 [API /order/user] ========== REQUEST START ==========");

    // 1. Get Token from cookies
    const cookieHeader = req.headers.get("cookie") || "";
    let token = "";

    // Try from Authorization header first
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // Try from cookie if no header
    if (!token) {
      const parts = cookieHeader.split(";");
      for (const part of parts) {
        const [k, v] = part.trim().split("=");
        if (k === "authToken" && v) {
          token = decodeURIComponent(v);
          break;
        }
      }
    }

    if (!token) {
      console.log("❌ [API /order/user] No token found in cookie or header");
      return NextResponse.json({ message: "Authentication Required" }, { status: 401 });
    }

    console.log("✅ [API /order/user] Token found, length:", token.length);

    // 2. Fetch Orders from Xano (now filtered by user on Xano side)
    const endpoint = `${API_URL}${ORDERS_PATH}`;
    console.log(`📡 [API /order/user] Fetching from: ${endpoint}`);

    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    console.log(`📊 [API /order/user] Response status: ${res.status}`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ [API /order/user] Error response:`, errorText);
      return NextResponse.json({
        success: true,
        data: [],
        error: `Failed to fetch orders: ${res.status}`
      }, { status: 200 });
    }

    const data = await res.json();
    console.log(`📦 [API /order/user] Raw response:`, JSON.stringify(data, null, 2));

    // Handle different response structures
    let orders: any[] = [];
    if (Array.isArray(data)) {
      orders = data;
    } else if (Array.isArray(data?.items)) {
      orders = data.items;
    } else if (Array.isArray(data?.data)) {
      orders = data.data;
    } else if (Array.isArray(data?.records)) {
      orders = data.records;
    }

    console.log(`✅ [API /order/user] Found ${orders.length} orders`);
    console.log("🔍 [API /order/user] ========== REQUEST END ==========");

    // Xano is now filtering by user, so we just return the data
    return NextResponse.json({ success: true, data: orders }, { status: 200 });

  } catch (err: any) {
    console.error("❌ [API /order/user] Unexpected error:", err);
    return NextResponse.json({
      message: "Unexpected error",
      detail: String(err?.message || err)
    }, { status: 500 });
  }
}