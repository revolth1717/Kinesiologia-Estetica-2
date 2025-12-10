import { NextResponse } from "next/server";

// Constants
const XANO_GENERAL = "https://x1xv-egpg-1mua.b2.xano.io/api:SzJNIj2V";

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

        // 3. Fetch Inventory
        const inventoryRes = await fetch(`${XANO_GENERAL}/inventory`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${xanoToken}`,
                Accept: "application/json",
            },
        });

        if (!inventoryRes.ok) {
            return NextResponse.json(
                { message: "Failed to fetch inventory from upstream" },
                { status: inventoryRes.status }
            );
        }

        const inventoryData = await inventoryRes.json();

        // 4. Return Data
        return NextResponse.json(inventoryData, { status: 200 });

    } catch (err) {
        return NextResponse.json(
            { message: "Unexpected error", detail: String(err) },
            { status: 500 }
        );
    }
}

