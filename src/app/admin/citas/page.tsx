"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { citasService } from "@/services/citasService";
import { Calendar, Clock, User, RefreshCw } from "lucide-react";

export default function AdminCitasPage() {
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/appointment", { method: "GET", credentials: "include" });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}${txt ? ` - ${txt}` : ""}`);
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      const norm = list.map((c: any) => ({
        id: Number(c?.id ?? 0),
        appointment_date: c?.appointment_date,
        service: String(c?.service ?? ""),
        status: String(c?.status ?? "pendiente").toLowerCase().trim(),
        user_id: Number(c?.user_id ?? 0),
        comments: c?.comments,
        created_at: c?.created_at,
        __rawUser: c?.user ?? c?.usuario ?? c?.profile ?? null,
        __userName: c?.user_name ?? c?.user?.name ?? c?.user?.nombre ?? c?.nombre ?? c?.name ?? null,
        __userEmail: c?.user?.email ?? c?.email ?? null,
      })) as any[];
      const need = norm.filter(x => (!x.__userName || String(x.__userName).trim() === "") && x.user_id > 0);
      if (need.length > 0) {
        const resolved = await Promise.all(need.map(async x => {
          try {
            const r = await fetch(`/api/user/${x.user_id}`, { credentials: "include" });
            const d = await r.json().catch(() => ({}));
            const n = d?.name ?? d?.nombre ?? d?.user?.name ?? d?.user?.nombre ?? null;
            return { id: x.id, name: typeof n === "string" ? n : null };
          } catch {
            return { id: x.id, name: null };
          }
        }));
        const byId = new Map(resolved.map(e => [e.id, e.name]));
        for (const item of norm) {
          const v = byId.get(item.id);
          if (v && (!item.__userName || String(item.__userName).trim() === "")) {
            item.__userName = v;
          }
        }
      }
      setCitas(norm);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const getNombre = (raw: any): string => {
    try {
      const nameRaw = raw?.__userName ?? raw?.__rawUser?.name ?? raw?.name ?? raw?.__rawUser?.nombre ?? raw?.nombre;
      const name = typeof nameRaw === 'string' ? nameRaw.trim() : '';
      if (name) return name;
      return 'Sin nombre';
    } catch {
      return 'Sin nombre';
    }
  };

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Citas</h1>
              <button onClick={fetchAll} className="flex items-center bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700">
                <RefreshCw className="h-5 w-5 mr-2" />
                Actualizar
              </button>
            </div>
            {loading && (
              <div className="px-6 py-6">Cargando citas...</div>
            )}
            {error && (
              <div className="px-6 py-6 text-red-600">{error}</div>
            )}
            {!loading && !error && (
              <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {citas.map((cita, idx) => (
                  <div key={`${cita.id}-${idx}`} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center mb-2">
                      <Calendar className="h-5 w-5 text-pink-600 mr-2" />
                      <span className="text-gray-800 font-semibold">{citasService.formatearFecha(cita.appointment_date)}</span>
                    </div>
                    <div className="flex items-center mb-2">
                      <Clock className="h-5 w-5 text-pink-600 mr-2" />
                      <span className="text-gray-700">{citasService.formatearHora(cita.appointment_date)}</span>
                    </div>
                    <div className="flex items-center mb-2">
                      <User className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="text-gray-700">{getNombre((cita as any))}</span>
                    </div>
                    <div className={`inline-block px-3 py-1 rounded ${citasService.obtenerColorEstado(cita.status)}`}>
                      {citasService.obtenerTextoEstado(cita.status)}
                    </div>
                    <div className="mt-3 text-sm text-gray-700">{cita.service}</div>
                  </div>
                ))}
                {citas.length === 0 && (
                  <div className="text-gray-600">No hay citas registradas.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}