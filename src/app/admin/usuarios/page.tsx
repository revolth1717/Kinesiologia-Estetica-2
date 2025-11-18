"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { citasService } from "@/services/citasService";
import { Calendar, Clock, RefreshCw, Edit3, CheckCircle, XCircle } from "lucide-react";

type UserLite = { id?: string | number; nombre?: string; email?: string; phone?: string };

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<UserLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [openUserId, setOpenUserId] = useState<string | number | null>(null);
  const [citasByUser, setCitasByUser] = useState<Record<string, any[]>>({});
  const [loadingUserId, setLoadingUserId] = useState<string | number | null>(null);
  const [errorUser, setErrorUser] = useState<string>("");
  const [selectedCitaId, setSelectedCitaId] = useState<number | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string>("");
  const [actionSuccess, setActionSuccess] = useState<string>("");
  const [schedId, setSchedId] = useState<number | null>(null);
  const [schedDate, setSchedDate] = useState<string>("");
  const [schedTime, setSchedTime] = useState<string>("");
  const [schedError, setSchedError] = useState<string>("");
  const [schedLoading, setSchedLoading] = useState(false);
  const [reschedMsgById, setReschedMsgById] = useState<Record<number, string>>({});

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

  const loadCitasForUser = async (userId: string | number) => {
    try {
      setLoadingUserId(userId);
      setErrorUser("");
      const res = await fetch(`/api/appointment`, { method: "GET", credentials: "include" });
      const text = await res.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
      if (!res.ok) {
        throw new Error(String(data?.error || data?.message || res.statusText));
      }
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      const uid = Number(userId);
      const mine = list.filter((c: any) => Number(c?.user_id ?? 0) === uid);
      setCitasByUser(prev => ({ ...prev, [String(userId)]: mine }));
    } catch (err: any) {
      setErrorUser(String(err?.message || err));
    } finally {
      setLoadingUserId(null);
    }
  };

  const doUpdateStatus = async (id: number, status: string) => {
    setActionError("");
    setActionSuccess("");
    setActionId(id);
    try {
      if (status === "cancelada") {
        await citasService.cancelarCita(id);
      } else {
        await citasService.actualizarEstado(id, status as any);
      }
      setCitasByUser(prev => {
        const updated = { ...prev };
        for (const k of Object.keys(updated)) {
          updated[k] = (updated[k] || []).map(c => (c.id === id ? { ...c, status } : c));
        }
        return updated;
      });
      setActionSuccess("Estado actualizado");
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err: any) {
      setActionError(String(err?.message || err));
      setTimeout(() => setActionError(""), 4000);
    } finally {
      setActionId(null);
    }
  };

  const schedCombine = (d: string, t: string): number => {
    try {
      const [yy, mm, dd] = d.split("-").map(x => parseInt(x, 10));
      const [HH, MM] = t.split(":").map(x => parseInt(x, 10));
      const dt = new Date(yy, mm - 1, dd, HH, MM, 0, 0);
      return dt.getTime();
    } catch {
      return 0;
    }
  };

  const doReschedule = async (id: number) => {
    setSchedError("");
    if (!schedDate || !schedTime) {
      setSchedError("Completa fecha y hora");
      return;
    }
    const ms = schedCombine(schedDate, schedTime);
    if (!ms || ms < Date.now()) {
      setSchedError("Fecha y hora inválidas");
      return;
    }
    setSchedLoading(true);
    try {
      const taken: string[] = await citasService.obtenerDisponibilidad(schedDate).catch(() => [] as string[]);
      if (Array.isArray(taken) && taken.includes(schedTime)) {
        setSchedError("Horario no disponible");
        return;
      }
      const userCitas = Object.values(citasByUser).flat();
      const curr = userCitas.find(c => c.id === id);
      await citasService.reprogramarCita(id, ms, curr?.status);
      const iso = new Date(ms).toISOString();
      setCitasByUser(prev => {
        const updated = { ...prev };
        for (const k of Object.keys(updated)) {
          updated[k] = (updated[k] || []).map(c => (c.id === id ? { ...c, appointment_date: iso, __reagendada: true } : c));
        }
        return updated;
      });
      const f = citasService.formatearFecha(iso);
      const h = citasService.formatearHora(iso);
      setReschedMsgById(prev => ({ ...prev, [id]: `Cita reprogramada a ${f} ${h}` }));
      setTimeout(() => {
        setReschedMsgById(prev => {
          const next = { ...prev } as Record<number, string>;
          delete next[id];
          return next;
        });
      }, 4000);
      setSchedId(null);
      setSchedDate("");
      setSchedTime("");
    } catch (err: any) {
      setSchedError(String(err?.message || err));
    } finally {
      setSchedLoading(false);
    }
  };

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
                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                          {u.id !== undefined && (
                            <div className="text-xs text-gray-500">ID: {String(u.id)}</div>
                          )}
                          <button
                            onClick={() => {
                              const idv = u.id as any;
                              const key = String(idv);
                              setOpenUserId(prev => (prev === idv ? null : idv));
                              if (openUserId !== idv && !citasByUser[key]) {
                                loadCitasForUser(idv);
                              }
                            }}
                            className="inline-flex items-center px-3 py-2 rounded-md bg-pink-600 text-white hover:bg-pink-700"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" /> Ver citas
                          </button>
                        </div>
                      </div>

                      {openUserId === u.id && (
                        <div className="mt-4">
                          {loadingUserId === u.id && (
                            <div className="text-gray-600">Cargando citas...</div>
                          )}
                          {errorUser && loadingUserId === null && (
                            <div className="text-red-600">{errorUser}</div>
                          )}
                          {!loadingUserId && !errorUser && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {(citasByUser[String(u.id)] || []).map((cita, i2) => (
                                <div
                                  key={`${cita.id}-${i2}`}
                                  className="border border-gray-200 rounded-md p-3 bg-white cursor-pointer"
                                  onClick={e => {
                                    const target = e.target as HTMLElement;
                                    if (
                                      target.closest(
                                        "button, input, select, textarea, [role='button']"
                                      )
                                    ) {
                                      return;
                                    }
                                    setSelectedCitaId(prev =>
                                      prev === cita.id ? null : cita.id
                                    );
                                  }}
                                >
                                  <div className="text-lg font-semibold text-gray-900 mb-2">
                                    {String(cita.service || "")}
                                  </div>
                                  <div className="flex items-center mb-1">
                                    <Calendar className="h-4 w-4 text-pink-600 mr-2" />
                                    <span className="text-gray-800 font-medium">
                                      {citasService.formatearFecha(cita.appointment_date)}
                                    </span>
                                  </div>
                                  <div className="flex items-center mb-1">
                                    <Clock className="h-4 w-4 text-pink-600 mr-2" />
                                    <span className="text-gray-700">
                                      {citasService.formatearHora(cita.appointment_date)}
                                    </span>
                                  </div>
                                  <div className={`inline-block mt-2 px-2 py-1 rounded ${citasService.obtenerColorEstado(String(cita.status || ""))}`}>
                                    {citasService.obtenerTextoEstado(String(cita.status || ""))}
                                  </div>
                                  {cita.__reagendada && (
                                    <div className={`inline-block mt-2 ml-2 px-2 py-1 rounded ${citasService.obtenerColorEstado("reagendada")}`}>
                                      {citasService.obtenerTextoEstado("reagendada")}
                                    </div>
                                  )}
                                  

                                  {selectedCitaId === cita.id && (
                                    <div className="mt-3">
                                      <div className="flex flex-wrap gap-2">
                                        {String(cita.status).toLowerCase().trim() !== "confirmada" && (
                                          <button
                                            onClick={e => {
                                              e.stopPropagation();
                                              doUpdateStatus(cita.id, "confirmada");
                                            }}
                                            disabled={actionId === cita.id}
                                            className="inline-flex items-center px-3 py-1 rounded-md bg-green-600 text-white"
                                          >
                                            <CheckCircle className="h-4 w-4 mr-1" /> Confirmar
                                          </button>
                                        )}
                                        {String(cita.status).toLowerCase().trim() !== "pendiente" && (
                                          <button
                                            onClick={e => {
                                              e.stopPropagation();
                                              doUpdateStatus(cita.id, "pendiente");
                                            }}
                                            disabled={actionId === cita.id}
                                            className="inline-flex items-center px-3 py-1 rounded-md bg-yellow-500 text-black"
                                          >
                                            Pendiente
                                          </button>
                                        )}
                                        {String(cita.status).toLowerCase().trim() !== "cancelada" && (
                                          <button
                                            onClick={e => {
                                              e.stopPropagation();
                                              doUpdateStatus(cita.id, "cancelada");
                                            }}
                                            disabled={actionId === cita.id}
                                            className="inline-flex items-center px-3 py-1 rounded-md bg-red-600 text-white"
                                          >
                                            <XCircle className="h-4 w-4 mr-1" /> Cancelar
                                          </button>
                                        )}
                                        <button
                                          onClick={e => {
                                            e.stopPropagation();
                                            setSelectedCitaId(cita.id);
                                            setSchedId(cita.id);
                                            setSchedDate("");
                                            setSchedTime("");
                                          }}
                                          className="inline-flex items-center px-3 py-1 rounded-md bg-blue-600 text-white"
                                        >
                                          <Edit3 className="h-4 w-4 mr-1" /> Reprogramar
                                        </button>
                                      </div>
                                      {actionError && actionId === null && (
                                        <div className="mt-2 text-sm text-red-600">{actionError}</div>
                                      )}
                                      {reschedMsgById[cita.id] && (
                                        <div className="mt-2 text-sm text-blue-700">{reschedMsgById[cita.id]}</div>
                                      )}
                                      {schedId === cita.id && (
                                        <div className="mt-3 space-y-2">
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <input
                                              type="date"
                                              value={schedDate}
                                              onChange={e => setSchedDate(e.target.value)}
                                              className="border border-gray-300 rounded-md px-3 py-2 w-full"
                                            />
                                            <input
                                              type="time"
                                              value={schedTime}
                                              onChange={e => setSchedTime(e.target.value)}
                                              className="border border-gray-300 rounded-md px-3 py-2 w-full"
                                            />
                                          </div>
                                          {schedError && (
                                            <div className="text-sm text-red-600">{schedError}</div>
                                          )}
                                          <div className="flex gap-2">
                                            <button
                                              onClick={e => {
                                                e.stopPropagation();
                                                doReschedule(cita.id);
                                              }}
                                              disabled={schedLoading}
                                              className="px-3 py-2 rounded-md bg-blue-600 text-white"
                                            >
                                              Guardar
                                            </button>
                                            <button
                                              onClick={e => {
                                                e.stopPropagation();
                                                setSchedId(null);
                                                setSchedDate("");
                                                setSchedTime("");
                                                setSchedError("");
                                              }}
                                              className="px-3 py-2 rounded-md bg-gray-200 text-gray-800"
                                            >
                                              Cancelar
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {(citasByUser[String(u.id)] || []).length === 0 && (
                                <div className="text-gray-600">Sin citas para este usuario.</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
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