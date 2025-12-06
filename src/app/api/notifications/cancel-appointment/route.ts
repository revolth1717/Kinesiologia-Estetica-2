import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { appointment, user } = body;

        // URL del Webhook de n8n para notificaciones de cancelación
        // REEMPLAZAR con la URL real de tu workflow de n8n
        const N8N_WEBHOOK_URL = process.env.N8N_CANCEL_WEBHOOK_URL || "https://kinesiologia.app.n8n.cloud/webhook/cancelar-cita";

        // Enviar datos a n8n
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tipo: "CANCELACION_CLIENTE",
                mensaje: "Un cliente ha cancelado su cita desde el perfil web.",
                cliente: {
                    nombre: user.nombre,
                    email: user.email,
                    telefono: user.phone,
                    id: user.id
                },
                cita: {
                    id: appointment.id,
                    tratamiento: appointment.service,
                    fecha_hora: appointment.appointment_date,
                    sesion: appointment.sesion
                },
                fecha_cancelacion: new Date().toISOString()
            }),
        });

        if (!response.ok) {
            console.warn("n8n webhook returned error:", response.status);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error sending cancellation notification:", error);
        // No fallamos la request principal si falla la notificación, solo logueamos
        return NextResponse.json({ success: false, error: "Failed to notify" }, { status: 500 });
    }
}
