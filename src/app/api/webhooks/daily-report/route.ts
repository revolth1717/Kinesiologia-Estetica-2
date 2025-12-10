import { NextResponse } from "next/server";

// Constants from other files
const XANO_GENERAL = process.env.XANO_GENERAL_API_URL || "https://x1xv-egpg-1mua.b2.xano.io/api:SzJNIj2V";
const XANO_AUTH =
    process.env.XANO_AUTH_API_URL ||
    process.env.NEXT_PUBLIC_AUTH_URL ||
    "https://x1xv-egpg-1mua.b2.xano.io/api:-E-1dvfg";

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

        let inventoryData: any[] = [];
        if (inventoryRes.ok) {
            const data = await inventoryRes.json();
            inventoryData = Array.isArray(data) ? data : (data.items || []);
        } else {
            console.error("Failed to fetch inventory", await inventoryRes.text());
        }

        // 4. Fetch Appointments
        const appointmentsRes = await fetch(`${XANO_AUTH}/appointment`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${xanoToken}`,
                Accept: "application/json",
            },
        });

        let appointmentsData: any[] = [];
        if (appointmentsRes.ok) {
            const data = await appointmentsRes.json();
            appointmentsData = Array.isArray(data) ? data : (data.items || []);
        } else {
            console.error("Failed to fetch appointments", await appointmentsRes.text());
        }

        // 5. Fetch Products (for Low Stock Alerts)
        let productsData: any[] = [];
        try {
            let prodTarget = `${XANO_GENERAL}/product`;
            let prodRes = await fetch(prodTarget, {
                method: "GET",
                headers: { Authorization: `Bearer ${xanoToken}`, Accept: "application/json" },
            });
            if (prodRes.status === 404) {
                prodTarget = `${XANO_GENERAL}/products`;
                prodRes = await fetch(prodTarget, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${xanoToken}`, Accept: "application/json" },
                });
            }
            if (prodRes.ok) {
                const pData = await prodRes.json();
                productsData = Array.isArray(pData) ? pData : (pData.items || pData.data || []);
            }
        } catch (e) {
            console.error("Failed to fetch products for daily report", e);
        }

        // 6. Filter Appointments for Today
        const today = new Date();
        // Adjust for Chile time (UTC-3 or UTC-4) - simplistic approach or use Intl
        const fmtDate = new Intl.DateTimeFormat("es-CL", {
            timeZone: "America/Santiago",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        const parts = fmtDate.formatToParts(today);
        const yy = parts.find(p => p.type === "year")?.value;
        const mm = parts.find(p => p.type === "month")?.value;
        const dd = parts.find(p => p.type === "day")?.value;
        const todayStr = `${yy}-${mm}-${dd}`; // YYYY-MM-DD

        const todaysAppointments = appointmentsData.filter((app: any) => {
            if (!app.appointment_date) return false;
            // appointment_date might be timestamp or ISO string
            let appDate: Date;
            if (typeof app.appointment_date === 'number') {
                appDate = new Date(app.appointment_date);
            } else {
                appDate = new Date(app.appointment_date);
            }

            // Format appDate to Chile time to compare
            const appParts = fmtDate.formatToParts(appDate);
            const ayy = appParts.find(p => p.type === "year")?.value;
            const amm = appParts.find(p => p.type === "month")?.value;
            const add = appParts.find(p => p.type === "day")?.value;
            const appDateStr = `${ayy}-${amm}-${add}`;

            return appDateStr === todayStr;
        });

        // 7. Calculate Low Stock Alerts (Stock <= 3)
        const lowStockAlerts: any[] = [];

        // Check Inventory (Insumos)
        if (Array.isArray(inventoryData)) {
            inventoryData.forEach((item: any) => {
                const stock = Number(item.current_stock || 0);
                if (stock <= 3) {
                    lowStockAlerts.push({
                        type: 'insumo',
                        name: item.product_name || item.name || 'Unknown Item',
                        stock: stock,
                        id: item.id
                    });
                }
            });
        }

        // Check Products (Venta)
        if (Array.isArray(productsData)) {
            productsData.forEach((item: any) => {
                // Assuming 'stock' or 'current_stock' or 'quantity' field exists
                const stock = Number(item.stock ?? item.current_stock ?? item.quantity ?? 0);
                if (stock <= 3) {
                    lowStockAlerts.push({
                        type: 'producto_venta',
                        name: item.name || item.title || 'Unknown Product',
                        stock: stock,
                        id: item.id
                    });
                }
            });
        }

        // 8. Return Combined Data
        return NextResponse.json({
            date: todayStr,
            inventory: inventoryData,
            products: productsData,
            appointments: todaysAppointments,
            low_stock_alerts: lowStockAlerts,
            summary: {
                total_inventory_items: Array.isArray(inventoryData) ? inventoryData.length : 0,
                total_products_items: productsData.length,
                total_appointments_today: todaysAppointments.length,
                low_stock_count: lowStockAlerts.length
            }
        }, { status: 200 });

    } catch (err) {
        return NextResponse.json(
            { message: "Unexpected error", detail: String(err) },
            { status: 500 }
        );
    }
}
