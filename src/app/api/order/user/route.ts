import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.XANO_GENERAL_API_URL || process.env.XANO_AUTH_API_URL || "https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V";
const ORDERS_PATH = process.env.NEXT_PUBLIC_ORDERS_PATH || "/order";

interface Order {
  id: number;
  user_id: number;
  total: number;
  status: string;
  created_at: number;
  items?: any[];
  [key: string]: any;
}

async function getMe(origin: string, token: string): Promise<any> {
  try {
    const res = await fetch(`${origin}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function GET(req: Request): Promise<Response> {
  try {
    // 1. Get Token
    const cookieHeader = req.headers.get("cookie") || "";
    let token = "";
    
    // Try from header
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
      return NextResponse.json({ message: "Authentication Required" }, { status: 401 });
    }

    // 2. Get User ID
    const url = new URL(req.url);
    const origin = url.origin;
    const me = await getMe(origin, token);
    const userId = me?.id ?? me?.user_id ?? me?.user?.id;

    if (!userId) {
      // If we can't identify the user, it's an auth issue
      return NextResponse.json({ message: "User identification failed" }, { status: 401 });
    }

    // 3. Fetch Orders from Xano
    // We try multiple endpoints to be safe, prioritizing the one filtering by user_id
    const candidates = [
      `${API_URL}${ORDERS_PATH}?user_id=${userId}`,
      `${API_URL}/order?user_id=${userId}`,
      `${API_URL}/orders?user_id=${userId}`,
    ];

    let orders: Order[] = [];
    let success = false;

    for (const target of candidates) {
      try {
        const res = await fetch(target, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          // Handle different response structures (array, object with items, etc.)
          if (Array.isArray(data)) {
            orders = data;
          } else if (Array.isArray(data?.items)) {
            orders = data.items;
          } else if (Array.isArray(data?.data)) {
            orders = data.data;
          } else if (Array.isArray(data?.records)) {
            orders = data.records;
          }
          success = true;
          break; 
        }
      } catch (e) {
        console.error(`Failed to fetch orders from ${target}`, e);
      }
    }

    if (!success) {
      // If we couldn't fetch specifically for user, we might return empty or try a fallback
      // For now, return empty array to avoid errors in frontend
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    return NextResponse.json({ success: true, data: orders }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ message: "Unexpected error", detail: String(err?.message || err) }, { status: 500 });
  }
}