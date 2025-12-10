import { NextResponse } from "next/server";

// Admin orders endpoint
const API_URL = "https://x1xv-egpg-1mua.b2.xano.io/api:-E-1dvfg";
const ADMIN_ORDERS_PATH = "/orderAllAdmin";

export async function GET(req: Request): Promise<Response> {
  try {
    console.log("🔍 [API /order/admin] ========== REQUEST START ==========");

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
      console.log("❌ [API /order/admin] No token found in cookie or header");
      return NextResponse.json({ message: "Authentication Required" }, { status: 401 });
    }

    console.log("✅ [API /order/admin] Token found, length:", token.length);

    // 2. Fetch ALL Orders from Xano (admin endpoint with role verification)
    const endpoint = `${API_URL}${ADMIN_ORDERS_PATH}`;
    console.log(`📡 [API /order/admin] Fetching from: ${endpoint}`);

    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    console.log(`📊 [API /order/admin] Response status: ${res.status}`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ [API /order/admin] Error response:`, errorText);

      // If 403, user is not admin
      if (res.status === 403) {
        return NextResponse.json({
          message: "Forbidden: Admin access required"
        }, { status: 403 });
      }

      return NextResponse.json({
        success: false,
        data: [],
        error: `Failed to fetch orders: ${res.status}`
      }, { status: res.status });
    }

    const data = await res.json();
    console.log(`📦 [API /order/admin] Raw response:`, JSON.stringify(data, null, 2));

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

    console.log(`✅ [API /order/admin] Found ${orders.length} orders`);
    console.log("🔍 [API /order/admin] ========== REQUEST END ==========");

    return NextResponse.json({ success: true, data: orders }, { status: 200 });

  } catch (err: any) {
    console.error("❌ [API /order/admin] Unexpected error:", err);
    return NextResponse.json({
      message: "Unexpected error",
      detail: String(err?.message || err)
    }, { status: 500 });
  }
}
