"use client";

import Link from "next/link";
import { Trash2, CreditCard } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CarritoPage() {
  const { items: cartItems, removeItem, subtotalAgenda, subtotalProductos, updateProductQuantity } = useCart();
  const productos = cartItems.filter(i => "tipo" in i && i.tipo === "producto");
  const citas = cartItems.filter(i => !("tipo" in i));
  
  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Carrito de Compras</h1>
        
        {(productos.length + citas.length) === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-500 mb-4 text-6xl flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Tu carrito está vacío</h2>
            <p className="text-gray-600 mb-6">Aún no has agregado productos o tratamientos.</p>
            <div className="flex gap-4 justify-center">
              <Link href="/productos" className="bg-pink-600 text-white hover:bg-pink-700 px-6 py-3 rounded-md font-medium">Ver Productos</Link>
              <Link href="/tratamientos" className="bg-pink-100 text-pink-700 hover:bg-pink-200 px-6 py-3 rounded-md font-medium">Ver Tratamientos</Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="lg:w-3/4">
              <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-[1200px] w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artículo</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Detalle
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productos.map((p) => (
                      <tr key={p.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {p.imagen_url ? (
                              <img src={p.imagen_url as string} alt={p.nombre} className="h-12 w-12 object-contain" />
                            ) : (
                              <div className="h-12 w-12 bg-pink-100 text-pink-600 flex items-center justify-center rounded">
                                <span className="font-semibold">{p.nombre.substring(0,1)}</span>
                              </div>
                            )}
                            <div className="text-sm font-medium text-gray-900">{p.nombre}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateProductQuantity(p.id, Math.max(1, p.cantidad - 1))} className="px-2 py-1 border rounded">-</button>
                            <input
                              type="number"
                              min={1}
                              value={p.cantidad}
                              onChange={(e) => updateProductQuantity(p.id, Math.max(1, Number(e.target.value || 1)))}
                              className="w-16 text-center border rounded"
                            />
                            <button onClick={() => updateProductQuantity(p.id, p.cantidad + 1)} className="px-2 py-1 border rounded">+</button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                          ${(p.precioUnitario * p.cantidad).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => removeItem(p.id)} className="inline-flex items-center gap-1 text-red-600 hover:text-red-800">
                            <Trash2 className="h-5 w-5" />
                            <span>Eliminar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {citas.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.tratamiento}{item.zona ? ` - ${item.zona}` : ""}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {(() => {
                              const [yy, mm, dd] = item.fecha.split("-").map(Number);
                              const d = new Date(yy, mm - 1, dd);
                              return d.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
                            })()}
                            <br />
                            {item.hora}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-normal break-words align-top">
                          <div className="text-sm text-gray-700 leading-5">{item.sesiones === 1 ? "1 sesión" : "8 sesiones"}</div>
                          <div className="text-sm text-gray-800 mt-1 font-semibold">Precio total: ${item.precioTotal.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => removeItem(item.id)} className="inline-flex items-center gap-1 text-red-600 hover:text-red-800">
                            <Trash2 className="h-5 w-5" />
                            <span>Eliminar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4">
                <Link href="/productos" className="text-pink-600 hover:text-pink-800 font-medium flex items-center mr-6">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Seguir comprando productos
                </Link>
                <Link href="/tratamientos" className="text-gray-700 hover:text-gray-900 font-medium flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Seguir comprando tratamientos
                </Link>
              </div>
            </div>
            
            <div className="lg:w-1/4 ml-auto min-w-[320px]">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4">Resumen del Pedido</h2>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-gray-600">Subtotal productos</span><span className="font-semibold text-gray-900">${subtotalProductos.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Subtotal agenda</span><span className="font-semibold text-gray-900">${subtotalAgenda.toLocaleString()}</span></div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total a pagar</span>
                      <span className="text-pink-600">${(subtotalAgenda + subtotalProductos).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Link
                    href="/pago"
                    className="w-full bg-pink-600 text-white hover:bg-pink-700 py-3 px-4 rounded-md font-medium flex items-center justify-center"
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    Proceder al Pago
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}