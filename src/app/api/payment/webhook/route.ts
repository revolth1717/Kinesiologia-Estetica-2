import { NextResponse } from "next/server";
import { payment } from "@/lib/mercadopago";

// Helper para actualizar orden en Xano
async function updateOrder(id: number, status: string, token?: string) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    // Usamos nuestra propia API interna para no duplicar lógica de auth/xano
    // Pero necesitamos un token... o usamos una API key de admin si tuviéramos.
    // Como es server-to-server, idealmente tendríamos un endpoint admin o usaríamos las vars de entorno de Xano directas.

    // Usaremos las variables de entorno de Xano directas para evitar problemas de auth de usuario
    const API_URL = process.env.NEXT_PUBLIC_XANO_CONTENT_API || process.env.NEXT_PUBLIC_XANO_CONTENT_API;
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
    const API_URL = process.env.NEXT_PUBLIC_XANO_CONTENT_API || process.env.NEXT_PUBLIC_XANO_CONTENT_API;
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

// Helper para crear pago en Xano
async function createPaymentInXano(paymentData: any, userId: any) {
    // Usamos la URL específica para pagos provista por el usuario
    const API_URL = process.env.NEXT_PUBLIC_XANO_PAYMENT_API || "https://x1xv-egpg-1mua.b2.xano.io/api:SzJNIj2V";
    const PAYMENT_PATH = "/payment"; 
    
    try {
        // 1. Primero verificamos si ya existe el pago para evitar duplicados
        // Intentamos filtrar por external_id. Si Xano no tiene habilitado el filtrado, 
        // esto podría devolver todos, así que filtramos en memoria también por seguridad.
        const checkRes = await fetch(`${API_URL}${PAYMENT_PATH}?external_id=${paymentData.id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (checkRes.ok) {
            const existingPayments = await checkRes.json();
            // Si devuelve un array y encontramos el ID, o si devuelve un objeto que es el pago
            const exists = Array.isArray(existingPayments) 
                ? existingPayments.some((p: any) => p.external_id === String(paymentData.id))
                : existingPayments?.external_id === String(paymentData.id);

            if (exists) {
                console.log("Pago ya existe en Xano, saltando creación:", paymentData.id);
                return;
            }
        }

        // 2. Si no existe, lo creamos
        await fetch(`${API_URL}${PAYMENT_PATH}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                external_id: String(paymentData.id),
                amount: paymentData.transaction_amount,
                status: paymentData.status,
                payment_method: paymentData.payment_type_id,
                date: paymentData.date_approved,
                items: JSON.stringify(paymentData.metadata.items),
                payer_email: paymentData.payer.email,
                user_id: userId ? Number(userId) : undefined
            })
        });
    } catch (e) {
        console.error("Error creating payment in Xano:", e);
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
                const userId = metadata.user_id;

                // Guardar pago en Xano
                await createPaymentInXano(paymentData, userId);

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
