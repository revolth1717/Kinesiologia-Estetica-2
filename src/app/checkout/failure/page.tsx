"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";

export default function FailurePage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
                <div className="flex justify-center mb-6">
                    <XCircle className="h-20 w-20 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                    Pago Fallido
                </h1>
                <p className="text-gray-600 mb-8">
                    Lo sentimos, hubo un problema al procesar tu pago. Por favor, intenta nuevamente o contacta a soporte.
                </p>
                <div className="space-y-4">
                    <Link
                        href="/carrito"
                        className="block w-full bg-pink-600 text-white font-medium py-3 px-4 rounded-md hover:bg-pink-700 transition-colors"
                    >
                        Volver al carrito
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
