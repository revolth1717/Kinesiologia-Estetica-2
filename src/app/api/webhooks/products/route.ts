import { NextResponse } from "next/server";

// Constants
const XANO_GENERAL = "https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V";

export async function GET(req: Request): Promise<Response> {
    try {
        // 1. Security Check
        const authHeader = req.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        // Check if the request has the correct secret
        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { message: "Unauthorized: Invalid or missing CRON_SECRET" },
                { status: 401 }
            );
        }

        // 2. Get Xano Token (Admin Token)
        const xanoToken = process.env.XANO_ADMIN_TOKEN;
        if (!xanoToken) {
            return NextResponse.json(
                { message: "Server Error: XANO_ADMIN_TOKEN not configured" },
                { status: 500 }
            );
        }

        // 3. Fetch Products
        // Try /product first, then /products if needed
        let target = `${XANO_GENERAL}/product`;
        let res = await fetch(target, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${xanoToken}`,
                Accept: "application/json",
            },
        });

        if (res.status === 404) {
            target = `${XANO_GENERAL}/products`;
            res = await fetch(target, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${xanoToken}`,
                    Accept: "application/json",
                },
            });
        }

        if (!res.ok) {
            return NextResponse.json(
                { message: "Failed to fetch products from upstream" },
                { status: res.status }
            );
        }

        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.items || data.data || []);

        // 4. Return Data
        return NextResponse.json(items, { status: 200 });

    } catch (err) {
        return NextResponse.json(
            { message: "Unexpected error", detail: String(err) },
            { status: 500 }
        );
    }
}
