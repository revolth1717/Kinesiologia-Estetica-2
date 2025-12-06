
import { preference } from "@/lib/mercadopago";

async function testMercadoPago() {
    try {
        console.log("Testing Mercado Pago connection...");
        // Attempt to create a dummy preference to test the token
        const result = await preference.create({
            body: {
                items: [
                    {
                        id: "test-item",
                        title: "Test Item",
                        quantity: 1,
                        unit_price: 100,
                        currency_id: "CLP",
                    },
                ],
                payer: {
                    email: "test@test.com",
                },
            },
        });
        console.log("Mercado Pago connection successful!");
        console.log("Init Point:", result.init_point);
    } catch (error: any) {
        console.error("Mercado Pago connection failed:");
        console.error("Error message:", error.message);
        console.error("Error status:", error.status);
        console.error("Error cause:", error.cause);
    }
}

testMercadoPago();
