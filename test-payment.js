// Using global fetch


async function testPayment() {
    try {
        const response = await fetch('http://localhost:3000/api/payment/create-preference', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: [
                    {
                        id: "test-1",
                        title: "Test Item",
                        quantity: 1,
                        unit_price: 1000,
                        type: "product",
                        xano_id: 123
                    }
                ],
                payer: {
                    email: "test_user_123@test.com"
                }
            }),
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testPayment();
