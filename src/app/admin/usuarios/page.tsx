"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

type UserLite = { id?: string | number; nombre?: string; email?: string; phone?: string };

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<UserLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/users?role=member`, { method: "GET", credentials: "include" });
        const text = await res.text();
        let data: any = null;
        try { data = JSON.parse(text); } catch { data = { raw: text }; }
        if (!res.ok) {
          throw new Error(String(data?.error || data?.message || res.statusText));
        }
        const arr: any[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        const norm: UserLite[] = arr.map((u: any) => ({
          id: u?.id,
          nombre: typeof u?.nombre === "string" ? u.nombre : typeof u?.name === "string" ? u.name : undefined,
          email: typeof u?.email === "string" ? u.email : undefined,
          phone: typeof u?.phone === "string" ? u.phone : undefined,
        }));
        setUsers(norm);
      } catch (err) {
        setError(typeof err === "string" ? err : (err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users;
    return users.filter(u => (u.nombre || "").toLowerCase().includes(term));
  }, [users, q]);

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-800">Buscador de usuarios</h1>
              <p className="text-gray-600">Buscar miembros por nombre y ver datos de contacto.</p>
            </div>
            <div className="px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                <input
                  type="text"
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Buscar por nombre"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full sm:max-w-sm"
                />
                <div className="text-sm text-gray-600">{filtered.length} resultados</div>
              </div>
              {loading && (
                <div className="text-gray-600">Cargando...</div>
              )}
              {error && (
                <div className="text-red-600">{error}</div>
              )}
              {!loading && !error && (
                <div className="grid grid-cols-1 gap-4">
                  {filtered.map((u, idx) => (
                    <div key={`${u.id ?? idx}`} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-lg font-semibold text-gray-800">{u.nombre || "Sin nombre"}</div>
                          <div className="mt-1 text-sm">
                            <span className="font-medium text-gray-800">Datos de contacto:</span>
                          </div>
                          <div className="text-sm text-gray-700">Teléfono: {u.phone || "Sin teléfono"}</div>
                          <div className="text-sm text-gray-700">Email: {u.email || "Sin email"}</div>
                        </div>
                        {u.id !== undefined && (
                          <div className="mt-2 sm:mt-0 text-xs text-gray-500">ID: {String(u.id)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <div className="text-center text-gray-600">No se encontraron usuarios.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}