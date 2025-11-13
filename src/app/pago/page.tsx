"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, CreditCard, ArrowRight } from "lucide-react";
import TrustBadges from "@/components/TrustBadges";
import { useCart } from "@/context/CartContext";
import { citasService } from "@/services/citasService";
import { useRouter } from "next/navigation";

export default function PagoPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const { items, clear, subtotalAgenda } = useCart();
  const router = useRouter();
  
  const handlePayment = async () => {
    setIsProcessing(true);
    setErrorMsg("");
    try {
      // Simulación de pago (2s)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Confirmado el pago: crear todas las citas pendientes
      await Promise.all(items.map(async (item) => {
        await citasService.crearCita(item.nuevaCita);
      }));

      clear();
      setIsCompleted(true);
    } catch (e) {
      console.error("Error al confirmar pago/crear citas:", e);
      setErrorMsg("Ocurrió un error al confirmar el pago. Intenta nuevamente.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Proceso de Pago</h1>
        <div className="mb-8 bg-blue-50 border border-blue-100 text-blue-800 px-4 py-3 rounded">
          ¿Tienes dudas sobre Webpay o cómo cancelar/reprogramar?{' '}
          <a href="/faq" className="underline font-medium">Revisa las Preguntas Frecuentes</a>.
        </div>
        
        {isCompleted ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-green-500 mb-4 flex justify-center">
              <CheckCircle className="h-20 w-20" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">¡Pago Completado!</h2>
            <p className="text-gray-600 mb-6">
              Tu pago fue confirmado y tus citas fueron agendadas correctamente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/" className="bg-pink-600 text-white hover:bg-pink-700 px-6 py-3 rounded-md font-medium">
                Volver al Inicio
              </Link>
              <Link href="/tratamientos" className="bg-white border border-pink-600 text-pink-600 hover:bg-pink-50 px-6 py-3 rounded-md font-medium">
                Ver Más Tratamientos
              </Link>
              <button onClick={() => router.push("/perfil")} className="bg-white border border-green-600 text-green-600 hover:bg-green-50 px-6 py-3 rounded-md font-medium">
                Ir a mi perfil
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold mb-4">Resumen de la Compra</h2>
              <div className="space-y-3">
                {items.map((it) => (
                  <div key={it.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{it.tratamiento}{it.zona ? ` - ${it.zona}` : ""} ({it.sesiones === 1 ? "1 sesión" : "8 sesiones"})</span>
                    <span className="font-medium">${("precioTotal" in it ? it.precioTotal : 0).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Total a pagar</span>
                    <span className="text-pink-600">${subtotalAgenda.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Método de Pago</h2>
              {errorMsg && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {errorMsg}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="border rounded-md p-4 flex items-center">
                  <input
                    type="radio"
                    id="webpay"
                    name="payment"
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500"
                    defaultChecked
                  />
                  <label htmlFor="webpay" className="ml-3 flex items-center">
                    <span className="font-medium mr-2">WebPay</span>
                    <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded">WebPay</div>
                  </label>
                </div>
                
                <div className="border rounded-md p-4 flex items-center opacity-50">
                  <input
                    type="radio"
                    id="creditcard"
                    name="payment"
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500"
                    disabled
                  />
                  <label htmlFor="creditcard" className="ml-3 flex items-center">
                    <span className="font-medium mr-2">Tarjeta de Crédito/Débito</span>
                    <CreditCard className="h-5 w-5 text-gray-500" />
                  </label>
                </div>
              </div>
              
              <div className="mt-8">
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className={`w-full flex items-center justify-center py-3 px-4 rounded-md font-medium ${
                    isProcessing
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-pink-600 text-white hover:bg-pink-700"
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando pago y creando citas...
                    </>
                  ) : (
                    <>
                      Pagar ahora <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
              
              <div className="mt-4 text-center text-sm text-gray-500">
                <p>Al hacer clic en "Pagar ahora", serás redirigido a WebPay para completar tu pago de forma segura.</p>
              </div>

              <TrustBadges />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}