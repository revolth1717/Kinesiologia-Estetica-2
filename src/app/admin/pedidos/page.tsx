"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminNav from "@/components/AdminNav";
import { RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Pedido = {
  id: number | string;
  user_id?: number | string;
  product_id?: number | string;
  status: string;
  order_date?: string;
  total?: number;
  quantity?: number;
  unit_price?: number;
  product_name?: string;
  product_image_url?: string;
  __userName?: string;
  __userEmail?: string;
  __userPhone?: string;
};

export default function AdminPedidosPage() {
  const [items, setItems] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<number | string | null>(null);
  const [actionMsg, setActionMsg] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "todos" | "confirmado" | "entregado"
  >("confirmado");
  const [cleanMsg, setCleanMsg] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/order/admin", {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const list: any[] = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];
      const norm: Pedido[] = list.map((o: any) => ({
        id: (() => {
          const raw = String(o?.id ?? o?.order_id ?? o?.ID ?? "");
          return /^\d+$/.test(raw) ? Number(raw) : raw;
        })(),
        user_id: o?.user_id ?? o?.usuario_id ?? o?.user?.id,
        product_id: o?.product_id ?? o?.producto_id ?? o?.product?.id,
        status: String(o?.status ?? "confirmado").toLowerCase(),
        order_date: (() => {
          const v = o?.order_date ?? o?.fecha ?? o?.created_at;
          if (typeof v === "number") return new Date(v).toISOString();
          const s = String(v || "").trim();
          if (/^\d+$/.test(s)) {
            const n = parseInt(s, 10);
            const ms = s.length >= 13 ? n : n * 1000;
            return new Date(ms).toISOString();
          }
          try {
            return new Date(s).toISOString();
          } catch {
            return undefined;
          }
        })(),
        total: typeof o?.total === "number" ? o.total : Number(o?.total || 0),
        quantity:
          typeof o?.quantity === "number"
            ? o.quantity
            : Number(o?.quantity || 1),
        unit_price:
          typeof o?.unit_price === "number"
            ? o.unit_price
            : Number(o?.unit_price || 0),
      }));

      try {
        const pr = await fetch("/api/productos", { method: "GET" });
        const tx = await pr.text();
        let pd: any = null;
        try {
          pd = JSON.parse(tx);
        } catch {
          pd = { raw: tx };
        }
        const arr: any[] = Array.isArray(pd?.data)
          ? pd.data
          : Array.isArray(pd)
            ? pd
            : [];
        const byId = new Map<string, any>();
        for (const p of arr) {
          const pid = String(
            p?.id ?? p?.ID ?? p?.product_id ?? p?.producto_id ?? ""
          );
          if (pid) byId.set(pid, p);
        }
        const aug = norm.map(o => {
          const pid = String(o.product_id ?? "");
          const p = byId.get(pid);
          const name =
            typeof p?.nombre === "string"
              ? p.nombre
              : typeof p?.name === "string"
                ? p.name
                : undefined;
          const imgObj = p?.imagen_url ?? p?.image_url ?? p?.imagen ?? p?.image;
          let img = "";
          if (typeof imgObj === "string") img = imgObj as string;
          else if (imgObj && typeof imgObj === "object") {
            const u =
              (imgObj as any)?.url ??
              (imgObj as any)?.download_url ??
              (imgObj as any)?.full_url ??
              (imgObj as any)?.href;
            if (typeof u === "string") img = u as string;
          }
          return { ...o, product_name: name, product_image_url: img } as Pedido;
        });
        // Enriquecer con datos de contacto del usuario comprador (una sola llamada)
        const contacts = new Map<
          string,
          { nombre?: string; email?: string; phone?: string }
        >();
        try {
          const listRes = await fetch(`/api/users?role=member`, {
            method: "GET",
            credentials: "include",
          });
          const ltext = await listRes.text();
          let ldata: any = null;
          try {
            ldata = JSON.parse(ltext);
          } catch {
            ldata = { raw: ltext };
          }
          const arr: any[] = Array.isArray(ldata?.data)
            ? ldata.data
            : Array.isArray(ldata)
              ? ldata
              : [];
          for (const u of arr) {
            const uid = String(u?.id ?? u?.user_id ?? "");
            if (!uid) continue;
            const nombreRaw = u?.nombre ?? u?.name ?? u?.full_name;
            const emailRaw = u?.email ?? u?.mail;
            const phoneRaw = u?.phone ?? u?.telefono ?? u?.phone_number;
            const nombre =
              typeof nombreRaw === "string"
                ? nombreRaw
                : nombreRaw
                  ? String(nombreRaw)
                  : undefined;
            const email =
              typeof emailRaw === "string"
                ? emailRaw
                : emailRaw
                  ? String(emailRaw)
                  : undefined;
            const phone =
              typeof phoneRaw === "string"
                ? phoneRaw
                : phoneRaw
                  ? String(phoneRaw)
                  : undefined;
            contacts.set(uid, { nombre, email, phone });
          }
        } catch { }
        const final = aug.map(x => {
          const c = contacts.get(String(x.user_id || ""));
          return {
            ...x,
            __userName: c?.nombre,
            __userEmail: c?.email,
            __userPhone: c?.phone,
          } as Pedido;
        });
        setItems(final);
      } catch {
        setItems(norm);
      }
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const displayItems = useMemo(() => {
    const filtered = items.filter(x => {
      if (statusFilter === "todos") return true;
      if (statusFilter === "entregado") return x.status === "entregado";
      // Si es "confirmado", mostramos todo lo que NO esté entregado
      // (incluyendo "confirmed", "paid", "pending", etc.)
      return x.status !== "entregado";
    });

    // Ordenar por fecha (más recientes primero)
    return filtered.sort((a, b) => {
      const dateA = a.order_date ? new Date(a.order_date).getTime() : 0;
      const dateB = b.order_date ? new Date(b.order_date).getTime() : 0;
      return dateB - dateA;
    });
  }, [items, statusFilter]);

  const limpiarEntregados = () => {
    try {
      setItems(prev =>
        prev.filter(x => String(x.status || "").toLowerCase() !== "entregado")
      );
      setCleanMsg("Pedidos entregados removidos de la vista");
      setTimeout(() => setCleanMsg(""), 2500);
    } catch (err: any) {
      setCleanMsg(String(err?.message || err));
      setTimeout(() => setCleanMsg(""), 4000);
    }
  };

  const marcarEntregado = async (id: number | string) => {
    setActionId(id);
    setActionMsg("");
    try {
      const numericOrStringId = /^\d+$/.test(String(id)) ? Number(id) : id;
      const target = `/api/order?id=${encodeURIComponent(
        String(numericOrStringId)
      )}`;
      const res = await fetch(target, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/plain, */*",
        },
        body: JSON.stringify({ status: "entregado" }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`${res.status} ${txt || res.statusText}`);
      }
      setItems(prev =>
        prev.map(x => (x.id === id ? { ...x, status: "entregado" } : x))
      );
      setActionMsg("Marcado como entregado");
      setTimeout(() => {
        setActionMsg("");
        setActionId(null);
      }, 2500);
    } catch (err: any) {
      setActionMsg(String(err?.message || err));
      setTimeout(() => {
        setActionMsg("");
        setActionId(null);
      }, 4000);
    }
  };

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="min-h-screen bg-gray-50 py-6 md:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdminNav />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Productos comprados
            </h1>
            <button
              onClick={fetchAll}
              disabled={loading}
              className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Actualizar
            </button>
          </div>
          <div className="flex items-center mb-4 gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter("confirmado")}
              className={`px-3 py-1 rounded-md text-sm ${statusFilter === "confirmado"
                ? "bg-pink-600 text-white"
                : "bg-gray-100 text-gray-700"
                }`}
            >
              Confirmados
            </button>
            <button
              onClick={() => setStatusFilter("entregado")}
              className={`px-3 py-1 rounded-md text-sm ${statusFilter === "entregado"
                ? "bg-pink-600 text-white"
                : "bg-gray-100 text-gray-700"
                }`}
            >
              Entregados
            </button>
            <button
              onClick={() => setStatusFilter("todos")}
              className={`px-3 py-1 rounded-md text-sm ${statusFilter === "todos"
                ? "bg-pink-600 text-white"
                : "bg-gray-100 text-gray-700"
                }`}
            >
              Todos
            </button>
          </div>
          {statusFilter === "todos" && (
            <div className="mb-3">
              <button
                onClick={limpiarEntregados}
                className="px-3 py-2 rounded-md text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Limpiar entregados
              </button>
            </div>
          )}
          {error && <div className="mb-4 text-red-600">{error}</div>}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="p-6 text-gray-600">Cargando...</div>
              ) : displayItems.length === 0 ? (
                <div className="p-6 text-gray-600">
                  {statusFilter === "entregado"
                    ? "No hay pedidos entregados"
                    : "No hay pedidos confirmados"}
                </div>
              ) : (
                displayItems.map(o => (
                  <div
                    key={o.id}
                    className="p-4 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      {o.product_image_url ? (
                        <img
                          src={String(o.product_image_url)}
                          alt={String(o.product_name || "Producto")}
                          className="w-14 h-14 md:w-12 md:h-12 rounded object-cover border"
                        />
                      ) : (
                        <div className="w-14 h-14 md:w-12 md:h-12 rounded bg-gray-100" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {String(
                            o.product_name ||
                            `Producto ID: ${String(o.product_id ?? "-")}`
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Cantidad: {Number(o.quantity).toLocaleString()} •
                          Total: ${Number(o.total).toLocaleString()}{" "}
                          {o.order_date
                            ? `• ${new Date(o.order_date).toLocaleString(
                              "es-CL"
                            )}`
                            : ""}
                        </div>
                        <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                          <strong>Contacto:</strong>
                          <div className="mt-1">
                            <span className="block">
                              Nombre: {o.__userName || "-"}
                            </span>
                            <span className="block">
                              Teléfono: {o.__userPhone || "-"}
                            </span>
                            <span className="block">
                              Email: {o.__userEmail || "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-left md:text-right flex flex-col md:items-end gap-2">
                      <span
                        className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${o.status === "entregado"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-800"
                          }`}
                      >
                        {o.status === "entregado" ? "Entregado" : "Confirmado"}
                      </span>
                      {o.status !== "entregado" && (
                        <button
                          onClick={() => marcarEntregado(o.id)}
                          disabled={actionId === o.id}
                          className="inline-flex items-center px-3 py-2 rounded-md bg-green-600 text-white w-full md:w-auto"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Marcar
                          entregado
                        </button>
                      )}
                      {actionMsg && actionId === o.id && (
                        <div className="mt-1 text-xs text-gray-600">
                          {actionMsg}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {actionMsg && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${actionMsg.toLowerCase().includes("entregado")
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
              }`}
          >
            {actionMsg.toLowerCase().includes("entregado") ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{actionMsg}</span>
          </div>
        </div>
      )}
      {cleanMsg && (
        <div className="fixed bottom-20 right-4 z-50">
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg bg-gray-800 text-white">
            <span className="text-sm font-medium">{cleanMsg}</span>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
