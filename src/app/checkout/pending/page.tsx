"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { useEffect } from "react";
import { useCart } from "@/context/CartContext";

export default function PendingPage() {
    const { clearCart } = useCart();

    useEffect(() => {
        // Opcional: limpiar carrito si se considera "en proceso"
        clearCart();
    }, [clearCart]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
                <div className="flex justify-center mb-6">
                    <Clock className="h-20 w-20 text-yellow-500" />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                    Pago Pendiente
                </h1>
                <p className="text-gray-600 mb-8">
                    Tu pago está siendo procesado. Te notificaremos cuando se confirme.
                </p>
                <div className="space-y-4">
                    <Link
                        href="/perfil"
                        className="block w-full bg-pink-600 text-white font-medium py-3 px-4 rounded-md hover:bg-pink-700 transition-colors"
                    >
                        Ver mis pedidos
                    </Link>
                    <Link
                        href="/"
                        className="block w-full bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-md hover:bg-gray-200 transition-colors"
                    >
                        Volver al inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}
