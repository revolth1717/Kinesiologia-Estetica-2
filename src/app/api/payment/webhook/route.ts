import { NextResponse } from "next/server";
import { payment } from "@/lib/mercadopago";

// Helper para actualizar orden en Xano
async function updateOrder(id: number, status: string, token?: string) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    // Usamos nuestra propia API interna para no duplicar lógica de auth/xano
    // Pero necesitamos un token... o usamos una API key de admin si tuviéramos.
    // Como es server-to-server, idealmente tendríamos un endpoint admin o usaríamos las vars de entorno de Xano directas.

    // Usaremos las variables de entorno de Xano directas para evitar problemas de auth de usuario
    const API_URL = process.env.XANO_GENERAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
    const ORDERS_PATH = process.env.NEXT_PUBLIC_ORDERS_PATH || "/order";

    try {
        const res = await fetch(`${API_URL}${ORDERS_PATH}/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_id: id, status: status }),
        });
        return res.ok;
    } catch (e) {
        console.error("Error updating order:", e);
        return false;
    }
}

// Helper para actualizar cita en Xano
async function updateAppointment(id: number, status: string) {
    const API_URL = process.env.XANO_GENERAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
    // Asumimos endpoint de citas
    try {
        const res = await fetch(`${API_URL}/appointment/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ appointment_id: id, status: status }),
        });
        return res.ok;
    } catch (e) {
        console.error("Error updating appointment:", e);
        return false;
    }
}

export async function POST(req: Request) {
    try {
        const url = new URL(req.url);
        const topic = url.searchParams.get("topic") || url.searchParams.get("type");
        const id = url.searchParams.get("id") || url.searchParams.get("data.id");

        if (topic === "payment" && id) {
            const paymentData = await payment.get({ id: id });

            if (paymentData.status === "approved") {
                const metadata = paymentData.metadata as any;
                const items = metadata.items || [];

                for (const item of items) {
                    if (item.type === "product") {
                        await updateOrder(item.xano_id, "confirmado"); // O "pagado"
                    } else if (item.type === "service") {
                        await updateAppointment(item.xano_id, "confirmada");
                    }
                }
            }
        }

        return NextResponse.json({ status: "ok" });
    } catch (error: any) {
        console.error("Webhook error:", error);
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
