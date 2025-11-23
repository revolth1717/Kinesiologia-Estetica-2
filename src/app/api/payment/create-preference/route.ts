import { NextResponse } from "next/server";
import { preference } from "@/lib/mercadopago";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { items, payer } = body;

        const mpItems = items.map((item: any) => ({
            id: String(item.id),
            title: item.title,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            currency_id: "CLP",
        }));

        const metadataItems = items.map((item: any) => ({
            id: item.id,
            type: item.type,
            xano_id: item.xano_id,
        }));

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

        const result = await preference.create({
            body: {
                items: mpItems,
                payer: {
                    email: payer?.email,
                },
                back_urls: {
                    success: `${baseUrl}/checkout/success`,
                    failure: `${baseUrl}/checkout/failure`,
                    pending: `${baseUrl}/checkout/pending`,
                },
                // auto_return: "approved",
                metadata: {
                    items: metadataItems,
                },
            },
        });

        return NextResponse.json({ init_point: result.init_point, id: result.id });
    } catch (error: any) {
        console.error("Error creating preference:", error);
        return NextResponse.json(
            { message: "Error creating preference", error: error.message },
            { status: 500 }
        );
    }
}
