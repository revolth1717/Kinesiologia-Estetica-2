"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { inventoryService, type InventoryItem } from "@/services/inventoryService";
import { Package, PlusCircle, MinusCircle, RefreshCw, Calendar } from "lucide-react";

type Producto = { nombre: string };

export default function AdminInventarioPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [productos, setProductos] = useState<Producto[]>([]);
  const [productName, setProductName] = useState<string | null>(null);
  const [entrada, setEntrada] = useState<string>("");
  const [salida, setSalida] = useState<string>("");
  const [actionMsg, setActionMsg] = useState<string>("");

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await inventoryService.listar();
      setItems(list);
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const deriveProductosFromItems = () => {
    const set = new Set<string>();
    for (const it of items) {
      const name = String(it.product_name ?? it.product?.nombre ?? "");
      if (name) set.add(name);
    }
    const arr: Producto[] = Array.from(set).map((nombre) => ({ nombre }));
    arr.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    setProductos(arr);
    if (!productName && arr.length > 0) setProductName(arr[0].nombre);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    deriveProductosFromItems();
  }, [items]);

  const currentStockMap = useMemo(() => {
    const map = new Map<string, { latestId: number; latestDate?: number; stock: number }>();
    for (const it of items) {
      const key = String(it.product_name ?? it.product?.nombre ?? "");
      if (!key) continue;
      const cur = map.get(key);
      const id = Number(it.id) || 0;
      // Normalize record_date to timestamp for ordering
      const dateTs = (() => {
        try {
          if (typeof it.record_date === "number") return it.record_date as number;
          if (typeof it.record_date === "string") return new Date(it.record_date).getTime();
          if (typeof it.created_at === "number") return it.created_at as number;
          if (typeof it.created_at === "string") return new Date(String(it.created_at)).getTime();
          return 0;
        } catch {
          return 0;
        }
      })();

      if (!cur) {
        map.set(key, { latestId: id, latestDate: dateTs, stock: it.current_stock });
        continue;
      }
      // Prefer newer by date, fallback to higher id
      const isNewer = (dateTs || 0) > (cur.latestDate || 0) || id > cur.latestId;
      if (isNewer) {
        map.set(key, { latestId: id, latestDate: dateTs, stock: it.current_stock });
      }
    }
    const result = new Map<string, number>();
    for (const [name, v] of map.entries()) result.set(name, v.stock);
    return result;
  }, [items]);

  const productNames = useMemo(() => productos.map(p => p.nombre), [productos]);

  const handleEntrada = async () => {
    setActionMsg("");
    try {
      const entradaQty = parseInt(String(entrada || ""), 10) || 0;
      if (!productName || entradaQty <= 0) {
        setActionMsg("Selecciona producto y cantidad válida");
        return;
      }
      await inventoryService.registrarEntrada(productName, entradaQty);
      setEntrada("");
      await fetchAll();
      setActionMsg("Entrada registrada");
      setTimeout(() => setActionMsg(""), 2500);
    } catch (err: any) {
      setActionMsg(String(err?.message || err));
      setTimeout(() => setActionMsg(""), 4000);
    }
  };

  const handleSalida = async () => {
    setActionMsg("");
    try {
      const salidaQty = parseInt(String(salida || ""), 10) || 0;
      if (!productName || salidaQty <= 0) {
        setActionMsg("Selecciona producto y cantidad válida");
        return;
      }
      await inventoryService.registrarSalida(productName, salidaQty);
      setSalida("");
      await fetchAll();
      setActionMsg("Salida registrada");
      setTimeout(() => setActionMsg(""), 2500);
    } catch (err: any) {
      setActionMsg(String(err?.message || err));
      setTimeout(() => setActionMsg(""), 4000);
    }
  };

  const [filterName, setFilterName] = useState<string>("all");
  const visibleItems = useMemo(() => {
    const itemsToShow = filterName === "all" ? items : items.filter((it) => String(it.product_name ?? it.product?.nombre ?? "") === String(filterName));
    const ts = (it: InventoryItem) => {
      try {
        if (typeof it.record_date === "number") return Number(it.record_date) || 0;
        if (typeof it.record_date === "string") return new Date(it.record_date).getTime() || 0;
        if (typeof it.created_at === "number") return Number(it.created_at) || 0;
        if (typeof it.created_at === "string") return new Date(String(it.created_at)).getTime() || 0;
      } catch {}
      return Number(it.id) || 0;
    };
    return itemsToShow.slice().sort((a, b) => ts(b) - ts(a));
  }, [items, filterName]);

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white rounded-full p-3">
                    <Package className="h-8 w-8 text-pink-600" />
                  </div>
                  <div className="ml-4">
                    <h1 className="text-2xl font-bold text-white">Gestión de inventario</h1>
                    <p className="text-pink-100">Registrar entradas y salidas de stock</p>
                  </div>
                </div>
                <button
                  onClick={() => fetchAll()}
                  className="bg-white/20 text-white px-4 py-2 rounded-md hover:bg-white/30 transition-colors flex items-center"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Actualizar
                </button>
              </div>
            </div>

            <div className="px-6 py-6">
              {loading ? (
                <div className="text-gray-600">Cargando inventario...</div>
              ) : error ? (
                <div className="text-red-600">{error}</div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                      <select
                        value={productName ?? ""}
                        onChange={(e) => setProductName(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 w-full"
                      >
                        {productNames.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                        {productNames.length === 0 && (
                          <option value={productName ?? ""}>{productName ?? "Producto"}</option>
                        )}
                      </select>
                      <p className="mt-2 text-sm text-gray-600">Stock actual: {productName ? (currentStockMap.get(String(productName)) ?? 0) : 0}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Entrada</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={0}
                          value={entrada}
                          onFocus={() => setEntrada("")}
                          onChange={(e) => {
                            const v = e.target.value;
                            const sanitized = v.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
                            setEntrada(sanitized);
                          }}
                          className="border border-gray-300 rounded-md px-3 py-2 w-full"
                        />
                        <button
                          onClick={handleEntrada}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                        >
                          <PlusCircle className="h-5 w-5 mr-1" />
                          Registrar
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salida</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={0}
                          value={salida}
                          onFocus={() => setSalida("")}
                          onChange={(e) => {
                            const v = e.target.value;
                            const sanitized = v.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
                            setSalida(sanitized);
                          }}
                          className="border border-gray-300 rounded-md px-3 py-2 w-full"
                        />
                        <button
                          onClick={handleSalida}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
                        >
                          <MinusCircle className="h-5 w-5 mr-1" />
                          Registrar
                        </button>
                      </div>
                    </div>
                  </div>

                  {actionMsg && <div className="text-sm text-gray-700">{actionMsg}</div>}

                  <div className="border-t pt-4">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">Registro de inventario</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {visibleItems.map((it, idx) => (
                        <div key={`${it.id}-${idx}`} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center mb-2">
                            <Package className="h-5 w-5 text-pink-600 mr-2" />
                          <span className="text-gray-800 font-semibold">{String(it.product_name ?? it.product?.nombre ?? "Producto")}</span>
                          </div>
                          <div className="text-sm text-gray-700">
                            <div className="flex justify-between">
                              <span>Entrada</span>
                              <span className="font-medium text-green-700">{it.entry}</span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span>Salida</span>
                              <span className="font-medium text-red-700">{it.exit}</span>
                            </div>
                            <div className="flex justify-between mt-2 border-t pt-2">
                              <span>Stock</span>
                              <span className="font-semibold text-pink-700">{it.current_stock}</span>
                            </div>
                            {it.record_date && (
                              <div className="flex items-center mt-2 text-gray-600">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span className="mr-1">Última vez editado:</span>
                                {(() => {
                                  try {
                                    const d =
                                      typeof it.record_date === "number"
                                        ? new Date(it.record_date)
                                        : new Date(String(it.record_date));
                                    return d.toLocaleString("es-CL");
                                  } catch {
                                    return String(it.record_date);
                                  }
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {visibleItems.length === 0 && (
                        <div className="text-gray-600">No hay movimientos de inventario.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}