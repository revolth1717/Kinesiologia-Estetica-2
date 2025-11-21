"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminNav from "@/components/AdminNav";
import { citasService } from "@/services/citasService";
import {
  Calendar,
  Clock,
  User,
  RefreshCw,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Edit3,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function AdminCitasPage() {
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/appointment", {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(
          `${res.status} ${res.statusText}${txt ? ` - ${txt}` : ""}`
        );
      }
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      const norm = list.map((c: any) => ({
        id: Number(c?.id ?? 0),
        appointment_date: c?.appointment_date,
        service: String(c?.service ?? ""),
        status: String(c?.status ?? "pendiente")
          .toLowerCase()
          .trim(),
        user_id: Number(c?.user_id ?? 0),
        comments: c?.comments,
        created_at: c?.created_at,
        sesion: typeof c?.sesion === "number" ? c.sesion : undefined,
        __rawUser: c?.user ?? c?.usuario ?? c?.profile ?? null,
        __userName:
          c?.user_name ??
          c?.user?.name ??
          c?.user?.nombre ??
          c?.nombre ??
          c?.name ??
          null,
        __userEmail: c?.user?.email ?? c?.email ?? null,
        __userPhone: c?.user?.phone ?? c?.phone ?? c?.phone_number ?? null,
      })) as any[];
      const deriveContactoFromComments = (
        txt: any
      ): { nombre?: string; email?: string; telefono?: string } | null => {
        try {
          const s = String(txt || "");
          const m = s.match(/Contacto:\s*(.+?)\s*-\s*(.+?)\s*-\s*(.+)/i);
          if (!m) return null;
          const nombre = m[1]?.trim();
          const email = m[2]?.trim();
          const telefono = m[3]?.trim();
          return { nombre, email, telefono };
        } catch {
          return null;
        }
      };
      for (const item of norm) {
        const parsed = deriveContactoFromComments(item.comments);
        if (!item.__userName || String(item.__userName).trim() === "") {
          if (parsed?.nombre) item.__userName = parsed.nombre;
        }
        if (!item.__userEmail || String(item.__userEmail).trim() === "") {
          if (parsed?.email) item.__userEmail = parsed.email;
        }
        if (!item.__userPhone || String(item.__userPhone).trim() === "") {
          if (parsed?.telefono) item.__userPhone = parsed.telefono;
        }
      }
      setCitas(norm);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState<string>("todos");
  const [servicio, setServicio] = useState<string>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sort, setSort] = useState<
    "fechaDesc" | "fechaAsc" | "estado" | "servicio" | "nombre"
  >("fechaDesc");
  const [view, setView] = useState<"lista" | "calendario" | "completadas">(
    "lista"
  );
  const [actionId, setActionId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string>("");
  const [actionSuccess, setActionSuccess] = useState<string>("");
  const [reschedMsgById, setReschedMsgById] = useState<Record<number, string>>(
    {}
  );
  const [completeMsgById, setCompleteMsgById] = useState<
    Record<number, string>
  >({});
  const [restrictActionsById, setRestrictActionsById] = useState<Record<number, boolean>>({});
  const [schedId, setSchedId] = useState<number | null>(null);
  const [schedDate, setSchedDate] = useState<string>("");
  const [schedTime, setSchedTime] = useState<string>("");
  const [schedError, setSchedError] = useState<string>("");
  const [schedLoading, setSchedLoading] = useState(false);

  const serviciosList = useMemo(() => {
    return Array.from(
      new Set(
        (citas || []).map(x => String(x?.service || "").trim()).filter(Boolean)
      )
    );
  }, [citas]);

  const toMs = (v: any): number => {
    try {
      if (typeof v === "number") return v;
      const s = String(v || "").trim();
      if (/^\d+$/.test(s)) {
        const num = parseInt(s, 10);
        return s.length >= 13 ? num : num * 1000;
      }
      const mSpace = s.match(
        /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/
      );
      if (mSpace) {
        const yy = parseInt(mSpace[1], 10);
        const mm = parseInt(mSpace[2], 10);
        const dd = parseInt(mSpace[3], 10);
        const HH = parseInt(mSpace[4], 10);
        const MM = parseInt(mSpace[5], 10);
        const SS = mSpace[6] ? parseInt(mSpace[6], 10) : 0;
        return new Date(yy, mm - 1, dd, HH, MM, SS, 0).getTime();
      }
      return new Date(s).getTime();
    } catch {
      return 0;
    }
  };

  const ymd = (ms: number): string => {
    const d = new Date(ms);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  };

  const getNombre = (raw: any): string => {
    try {
      const nameRaw =
        raw?.__userName ??
        raw?.__rawUser?.name ??
        raw?.name ??
        raw?.__rawUser?.nombre ??
        raw?.nombre;
      const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
      if (name) return name;
      return "Sin nombre";
    } catch {
      return "Sin nombre";
    }
  };

  const getEmail = (raw: any): string | null => {
    try {
      const emailRaw = raw?.__userEmail ?? raw?.__rawUser?.email ?? raw?.email;
      const email = typeof emailRaw === "string" ? emailRaw.trim() : "";
      return email || null;
    } catch {
      return null;
    }
  };

  const getTelefono = (raw: any): string | null => {
    try {
      const phoneRaw =
        raw?.__userPhone ??
        raw?.__rawUser?.phone ??
        raw?.phone ??
        raw?.phone_number;
      const phone = typeof phoneRaw === "string" ? phoneRaw.trim() : "";
      return phone || null;
    } catch {
      return null;
    }
  };

  const visibleCitas = useMemo(() => {
    let arr = Array.isArray(citas) ? citas.slice() : [];
    const q = query.trim().toLowerCase();
    if (q) {
      arr = arr.filter(c => {
        const nombre = getNombre(c).toLowerCase();
        const email = String(getEmail(c) || "").toLowerCase();
        const phone = String(getTelefono(c) || "").toLowerCase();
        const svc = String(c?.service || "").toLowerCase();
        return (
          nombre.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          svc.includes(q)
        );
      });
    }
    if (estado && estado !== "todos") {
      arr = arr.filter(
        c =>
          String(c?.status || "")
            .toLowerCase()
            .trim() === estado
      );
    }
    if (servicio && servicio.trim().length > 0) {
      const target = servicio.toLowerCase().trim();
      arr = arr.filter(
        c =>
          String(c?.service || "")
            .toLowerCase()
            .trim() === target
      );
    }
    if (fromDate) {
      arr = arr.filter(c => ymd(toMs(c?.appointment_date)) >= fromDate);
    }
    if (toDate) {
      arr = arr.filter(c => ymd(toMs(c?.appointment_date)) <= toDate);
    }
    if (view === "lista") {
      arr = arr.filter(c => {
        const st = String(c?.status || "")
          .toLowerCase()
          .trim();
        if (st === "confirmada") return false;
        if (st === "completada") return Boolean(completeMsgById[(c as any).id]);
        return true;
      });
    }
    arr.sort((a, b) => {
      if (sort === "fechaAsc")
        return toMs(b?.appointment_date) - toMs(a?.appointment_date);
      if (sort === "estado")
        return String(a?.status || "").localeCompare(String(b?.status || ""));
      if (sort === "servicio")
        return String(a?.service || "").localeCompare(String(b?.service || ""));
      if (sort === "nombre") return getNombre(a).localeCompare(getNombre(b));
      return toMs(a?.appointment_date) - toMs(b?.appointment_date);
    });
    return arr;
  }, [
    citas,
    query,
    estado,
    servicio,
    fromDate,
    toDate,
    sort,
    view,
    completeMsgById,
  ]);

  const doUpdateStatus = async (id: number, status: string) => {
    setActionError("");
    setActionSuccess("");
    setActionId(id);
    try {
      const curr = (citas || []).find(c => c.id === id) as any;
      const currSes =
        typeof curr?.sesion === "number" ? curr.sesion : undefined;
      if (status === "cancelada") {
        await citasService.cancelarCita(id, currSes);
      } else {
        if (typeof currSes !== "number") {
          throw new Error(
            "Falta el campo 'sesion' en la cita para actualizar el estado"
          );
        }
        await citasService.actualizarCita(id, {
          status: String(status).toUpperCase(),
          sesion: currSes,
        } as any);
      }
      setCitas(prev => prev.map(c => (c.id === id ? { ...c, status } : c)));
      await fetchAll();
      setActionSuccess("Estado actualizado");
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err: any) {
      setActionError(String(err?.message || err));
      setTimeout(() => setActionError(""), 4000);
    } finally {
      setActionId(null);
    }
  };

  const doDescontarSesion = async (id: number) => {
    setActionError("");
    setActionSuccess("");
    setActionId(id);
    try {
      const curr = (citas || []).find(c => c.id === id) as any;
      const currSes =
        typeof curr?.sesion === "number" ? curr.sesion : undefined;
      if (typeof currSes !== "number") {
        setActionError(
          "La cita no tiene el campo 'sesion' definido en la base de datos."
        );
        setTimeout(() => setActionError(""), 4000);
        setActionId(null);
        return;
      }
      const nextSes = Math.max(0, currSes - 1);
      if (nextSes === 0) {
        await citasService.actualizarCita(id, {
          sesion: 0,
          status: "COMPLETADA",
        } as any);
        setCitas(prev =>
          prev.map(c =>
            c.id === id ? { ...c, sesion: 0, status: "completada" } : c
          )
        );
        setCompleteMsgById(prev => ({
          ...prev,
          [id]: "Las sesiones han sido completadas correctamente.",
        }));
        setTimeout(() => {
          setCompleteMsgById(prev => {
            const next = { ...prev } as Record<number, string>;
            delete next[id];
            return next;
          });
          fetchAll();
        }, 4000);
      } else {
        await citasService.actualizarCita(id, {
          sesion: nextSes,
          status: "PENDIENTE",
        } as any);
        setCitas(prev =>
          prev.map(c => (c.id === id ? { ...c, sesion: nextSes, status: "pendiente" } : c))
        );
        setRestrictActionsById(prev => ({ ...prev, [id]: true }));
        setActionSuccess("Sesión descontada");
        setTimeout(() => setActionSuccess(""), 3000);
      }
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
      console.log("[UI] Reprogramar click", { id, schedDate, schedTime, ms });
      const dTarget = new Date(ms);
      const targetYmd = ymd(ms);
      const targetHHMM = `${String(dTarget.getHours()).padStart(
        2,
        "0"
      )}:${String(dTarget.getMinutes()).padStart(2, "0")}`;
      const conflictLocal = (citas || []).some(c => {
        if (c.id === id) return false;
        const st = String(c?.status || "")
          .toLowerCase()
          .trim();
        if (st === "cancelada" || st === "completada") return false;
        const msC = toMs(c?.appointment_date);
        const yC = ymd(msC);
        const dC = new Date(msC);
        const hhmmC = `${String(dC.getHours()).padStart(2, "0")}:${String(
          dC.getMinutes()
        ).padStart(2, "0")}`;
        return yC === targetYmd && hhmmC === targetHHMM;
      });
      if (conflictLocal) {
        setSchedError("Horario no disponible");
        return;
      }
      const taken: string[] = await citasService
        .obtenerDisponibilidad(schedDate)
        .catch(() => [] as string[]);
      if (Array.isArray(taken) && taken.includes(schedTime)) {
        setSchedError("Horario no disponible");
        return;
      }
      const curr = (citas || []).find(c => c.id === id);
      await citasService.reprogramarCita(id, ms, curr?.status);
      console.log("[UI] Reprogramar OK", { id, newDateMs: ms });
      const iso = new Date(ms).toISOString();
      setCitas(prev =>
        prev.map(c =>
          c.id === id ? { ...c, appointment_date: iso, __reagendada: true } : c
        )
      );
      setRestrictActionsById(prev => {
        const next = { ...prev } as Record<number, boolean>;
        delete next[id];
        return next;
      });
      await fetchAll();
      const f = citasService.formatearFecha(iso);
      const h = citasService.formatearHora(iso);
      setReschedMsgById(prev => ({
        ...prev,
        [id]: `Cita reprogramada a ${f} ${h}`,
      }));
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
      console.error("[UI] Reprogramar error", err);
      setSchedError(String(err?.message || err));
    } finally {
      setSchedLoading(false);
    }
  };

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const calGrid = useMemo(() => {
    const first = new Date(calYear, calMonth, 1);
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const startOffset = (first.getDay() + 6) % 7;
    const cells: { ymd: string | null; count: number }[] = [];
    for (let i = 0; i < startOffset; i++) cells.push({ ymd: null, count: 0 });
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(calYear, calMonth, d);
      const key = ymd(dt.getTime());
      const count = (citas || [])
        .filter(c => ymd(toMs(c?.appointment_date)) === key)
        .filter(c => {
          const st = String(c?.status || "")
            .toLowerCase()
            .trim();
          if (st === "pendiente") return false;
          if (st === "completada")
            return Boolean(completeMsgById[(c as any).id]);
          return true;
        }).length;
      cells.push({ ymd: key, count });
    }
    while (cells.length % 7 !== 0) cells.push({ ymd: null, count: 0 });
    const weeks: { ymd: string | null; count: number }[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }, [calYear, calMonth, citas, completeMsgById]);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const dayCitas = useMemo(() => {
    if (!selectedDay) return [] as any[];
    return (citas || [])
      .filter(c => ymd(toMs(c?.appointment_date)) === selectedDay)
      .filter(c => {
        const st = String(c?.status || "")
          .toLowerCase()
          .trim();
        if (st === "pendiente") return false;
        if (st === "completada") return Boolean(completeMsgById[(c as any).id]);
        return true;
      });
  }, [selectedDay, citas, completeMsgById]);

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdminNav />
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                Gestión de Citas
              </h1>
              <button
                onClick={fetchAll}
                className="flex items-center justify-center bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 w-full sm:w-auto"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Actualizar
              </button>
            </div>
            {loading && <div className="px-6 py-6">Cargando citas...</div>}
            {error && <div className="px-6 py-6 text-red-600">{error}</div>}
            {!loading && !error && (
              <div className="px-6 py-6">
                <div className="mb-4 flex items-center gap-2">
                  <button
                    onClick={() => setView("lista")}
                    className={`px-3 py-2 rounded-md border ${
                      view === "lista"
                        ? "bg-pink-600 text-white border-pink-600"
                        : "bg-white text-gray-800 border-gray-300"
                    }`}
                  >
                    Lista
                  </button>
                  <button
                    onClick={() => setView("calendario")}
                    className={`px-3 py-2 rounded-md border ${
                      view === "calendario"
                        ? "bg-pink-600 text-white border-pink-600"
                        : "bg-white text-gray-800 border-gray-300"
                    }`}
                  >
                    Calendario
                  </button>
                  <button
                    onClick={() => setView("completadas")}
                    className={`px-3 py-2 rounded-md border ${
                      view === "completadas"
                        ? "bg-pink-600 text-white border-pink-600"
                        : "bg-white text-gray-800 border-gray-300"
                    }`}
                  >
                    Completadas
                  </button>
                </div>
                {view === "lista" && (
                  <div>
                    <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Buscar por nombre, email, teléfono o servicio"
                        className="border border-gray-300 rounded-md px-3 py-2 w-full"
                      />
                      <select
                        value={estado}
                        onChange={e => setEstado(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 w-full"
                      >
                        <option value="todos">Todos los estados</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                      <select
                        value={servicio}
                        onChange={e => setServicio(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 w-full"
                      >
                        <option value="">Todos los servicios</option>
                        {serviciosList.map(s => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-600 mb-1">
                          Desde
                        </span>
                        <input
                          type="date"
                          value={fromDate}
                          onChange={e => setFromDate(e.target.value)}
                          className="border border-gray-300 rounded-md px-3 py-2 w-full"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-600 mb-1">
                          Hasta
                        </span>
                        <input
                          type="date"
                          value={toDate}
                          onChange={e => setToDate(e.target.value)}
                          className="border border-gray-300 rounded-md px-3 py-2 w-full"
                        />
                      </div>
                      <select
                        value={sort}
                        onChange={e => setSort(e.target.value as any)}
                        className="border border-gray-300 rounded-md px-3 py-2 w-full"
                      >
                        <option value="fechaDesc">
                          Ordenar: Fecha más reciente
                        </option>
                        <option value="fechaAsc">
                          Ordenar: Fecha más antigua
                        </option>
                        <option value="estado">Ordenar: Estado</option>
                        <option value="servicio">Ordenar: Servicio</option>
                        <option value="nombre">Ordenar: Nombre</option>
                      </select>
                      <button
                        onClick={() => {
                          setQuery("");
                          setEstado("todos");
                          setServicio("");
                          setFromDate("");
                          setToDate("");
                          setSort("fechaDesc");
                        }}
                        className="bg-gray-100 text-gray-800 rounded-md px-3 py-2 border border-gray-300"
                      >
                        Limpiar filtros
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {visibleCitas.map((cita, idx) => (
                        <div
                          key={`${cita.id}-${idx}`}
                          className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                        >
                          <div className="text-lg font-semibold text-gray-900 mb-2">
                            {String(cita.service || "")}
                          </div>
                          <div className="flex items-center mb-2">
                            <Calendar className="h-5 w-5 text-pink-600 mr-2" />
                            <span className="text-gray-800 font-semibold">
                              {citasService.formatearFecha(
                                cita.appointment_date
                              )}
                            </span>
                          </div>
                          <div className="flex items-center mb-2">
                            <Clock className="h-5 w-5 text-pink-600 mr-2" />
                            <span className="text-gray-700">
                              {citasService.formatearHora(
                                cita.appointment_date
                              )}
                            </span>
                          </div>
                          <div className="flex items-center mb-2">
                            <User className="h-5 w-5 text-gray-600 mr-2" />
                            <span className="text-gray-700">
                              {getNombre(cita as any)}
                            </span>
                          </div>
                          {getEmail(cita) && (
                            <div className="flex items-center mb-2">
                              <Mail className="h-5 w-5 text-gray-600 mr-2" />
                              <span className="text-gray-700">
                                {getEmail(cita)}
                              </span>
                            </div>
                          )}
                          {getTelefono(cita) && (
                            <div className="flex items-center mb-2">
                              <Phone className="h-5 w-5 text-gray-600 mr-2" />
                              <span className="text-gray-700">
                                {getTelefono(cita)}
                              </span>
                            </div>
                          )}
                          <div
                            className={`inline-block px-2.5 py-1 rounded text-sm ${citasService.obtenerColorEstado(
                              cita.status
                            )}`}
                          >
                            {citasService.obtenerTextoEstado(cita.status)}
                          </div>
                          {typeof (cita as any).sesion === "number" && (
                            <div className="inline-block ml-1 px-2.5 py-1 rounded bg-gray-100 text-gray-700 text-sm">
                              {(cita as any).sesion} sesiones restantes
                            </div>
                          )}
                          {cita.__reagendada && (
                            <div
                              className={`inline-block ml-1 px-2.5 py-1 rounded text-sm ${citasService.obtenerColorEstado(
                                "reagendada"
                              )}`}
                            >
                              {citasService.obtenerTextoEstado("reagendada")}
                            </div>
                          )}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {!restrictActionsById[cita.id] && cita.status !== "confirmada" && (
                              <button
                                onClick={() =>
                                  doUpdateStatus(cita.id, "confirmada")
                                }
                                disabled={actionId === cita.id}
                                className="inline-flex items-center px-3 py-1 rounded-md bg-green-600 text-white"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />{" "}
                                Confirmar
                              </button>
                            )}
                            {cita.status === "confirmada" &&
                              typeof (cita as any).sesion === "number" &&
                              (cita as any).sesion > 0 && (
                                <button
                                  onClick={() => doDescontarSesion(cita.id)}
                                  disabled={actionId === cita.id}
                                  className="inline-flex items-center px-3 py-1 rounded-md bg-purple-600 text-white"
                                >
                                  {(cita as any).sesion === 1
                                    ? "Completar"
                                    : "Descontar sesión"}
                                </button>
                              )}
                            {!restrictActionsById[cita.id] && cita.status !== "pendiente" && (
                              <button
                                onClick={() =>
                                  doUpdateStatus(cita.id, "pendiente")
                                }
                                disabled={actionId === cita.id}
                                className="inline-flex items-center px-3 py-1 rounded-md bg-yellow-500 text-black"
                              >
                                Pendiente
                              </button>
                            )}
                            {!restrictActionsById[cita.id] && cita.status !== "cancelada" && (
                              <button
                                onClick={() =>
                                  doUpdateStatus(cita.id, "cancelada")
                                }
                                disabled={actionId === cita.id}
                                className="inline-flex items-center px-3 py-1 rounded-md bg-red-600 text-white"
                              >
                                <XCircle className="h-4 w-4 mr-1" /> Cancelar
                              </button>
                            )}
                            <button
                              onClick={() => {
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
                            <div className="mt-2 text-sm text-red-600">
                              {actionError}
                            </div>
                          )}
                          {reschedMsgById[cita.id] && (
                            <div className="mt-2 text-sm text-blue-700">
                              {reschedMsgById[cita.id]}
                            </div>
                          )}
                          {completeMsgById[cita.id] && (
                            <div className="mt-2 text-sm text-green-700">
                              {completeMsgById[cita.id]}
                            </div>
                          )}
                          {schedId === cita.id && (
                            <div className="mt-3 space-y-2">
                              <div className="flex gap-2">
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
                                <div className="text-sm text-red-600">
                                  {schedError}
                                </div>
                              )}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => doReschedule(cita.id)}
                                  disabled={schedLoading}
                                  className="px-3 py-2 rounded-md bg-blue-600 text-white"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => {
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
                          <div className="mt-3 text-sm text-gray-700"></div>
                        </div>
                      ))}
                      {visibleCitas.length === 0 && (
                        <div className="text-gray-600">
                          No hay citas registradas.
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {view === "calendario" && (
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <button
                        onClick={() => {
                          const m = calMonth - 1;
                          if (m < 0) {
                            setCalMonth(11);
                            setCalYear(calYear - 1);
                          } else {
                            setCalMonth(m);
                          }
                        }}
                        className="px-2 py-2 rounded-md border border-gray-300 bg-white"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <div className="px-3 py-2 text-pink-700 font-semibold">
                        {new Date(calYear, calMonth, 1).toLocaleString(
                          "es-ES",
                          { month: "long", year: "numeric" }
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const m = calMonth + 1;
                          if (m > 11) {
                            setCalMonth(0);
                            setCalYear(calYear + 1);
                          } else {
                            setCalMonth(m);
                          }
                        }}
                        className="px-2 py-2 rounded-md border border-gray-300 bg-white"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {[
                        "Lunes",
                        "Martes",
                        "Miércoles",
                        "Jueves",
                        "Viernes",
                        "Sábado",
                        "Domingo",
                      ].map(k => (
                        <div
                          key={k}
                          className="text-center text-xs font-semibold text-pink-700"
                        >
                          {k}
                        </div>
                      ))}
                      {calGrid.map((week, wi) =>
                        week.map((cell, di) => {
                          const isEmpty = !cell.ymd;
                          const isSel = !isEmpty && selectedDay === cell.ymd;
                          const isToday =
                            !isEmpty && cell.ymd === ymd(Date.now());
                          const isPast = !isEmpty && cell.ymd < ymd(Date.now());
                          const hasAppt = !isEmpty && cell.count > 0;
                          const dayNum = !isEmpty
                            ? Number(String(cell.ymd).slice(8, 10))
                            : 0;
                          const base =
                            isEmpty || isPast
                              ? "bg-gray-100 text-gray-400"
                              : hasAppt
                              ? "bg-pink-50 text-pink-800"
                              : "bg-white text-gray-800";
                          const border = isSel
                            ? "border-pink-600"
                            : hasAppt && !isPast
                            ? "border-pink-500"
                            : "border-gray-200";
                          const ring = isToday ? "ring-2 ring-pink-600" : "";
                          return (
                            <button
                              key={`${wi}-${di}-${cell.ymd ?? "empty"}`}
                              disabled={isEmpty || isPast}
                              onClick={() =>
                                !(isEmpty || isPast) &&
                                setSelectedDay(String(cell.ymd))
                              }
                              className={`relative h-20 border ${border} rounded-md p-2 ${base} ${ring} flex flex-col justify-between hover:border-pink-400`}
                            >
                              {hasAppt && (
                                <span
                                  className={`absolute top-1 right-1 h-2 w-2 rounded-full ${
                                    isPast ? "bg-gray-400" : "bg-pink-600"
                                  }`}
                                ></span>
                              )}
                              {isToday && (
                                <span className="absolute top-1 left-1 text-[10px] font-semibold text-pink-700">
                                  Hoy
                                </span>
                              )}
                              <div className="text-sm font-medium">
                                {!isEmpty ? dayNum : ""}
                              </div>
                              {!isEmpty && (
                                <div
                                  className={`text-xs ${
                                    cell.count > 0
                                      ? "text-pink-600"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {cell.count} citas
                                </div>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                    {selectedDay && (
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">
                          {selectedDay}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {dayCitas.map((cita, idx) => (
                            <div
                              key={`${cita.id}-${idx}`}
                              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                            >
                              <div className="text-lg font-semibold text-gray-900 mb-2">
                                {String(cita.service || "")}
                              </div>
                              <div className="flex items-center mb-2">
                                <Calendar className="h-5 w-5 text-pink-600 mr-2" />
                                <span className="text-gray-800 font-semibold">
                                  {citasService.formatearFecha(
                                    cita.appointment_date
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center mb-2">
                                <Clock className="h-5 w-5 text-pink-600 mr-2" />
                                <span className="text-gray-700">
                                  {citasService.formatearHora(
                                    cita.appointment_date
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center mb-2">
                                <User className="h-5 w-5 text-gray-600 mr-2" />
                                <span className="text-gray-700">
                                  {getNombre(cita as any)}
                                </span>
                              </div>
                              {getEmail(cita) && (
                                <div className="flex items-center mb-2">
                                  <Mail className="h-5 w-5 text-gray-600 mr-2" />
                                  <span className="text-gray-700">
                                    {getEmail(cita)}
                                  </span>
                                </div>
                              )}
                              {getTelefono(cita) && (
                                <div className="flex items-center mb-2">
                                  <Phone className="h-5 w-5 text-gray-600 mr-2" />
                                  <span className="text-gray-700">
                                    {getTelefono(cita)}
                                  </span>
                                </div>
                              )}
                              <div
                                className={`inline-block px-2.5 py-1 rounded text-sm ${citasService.obtenerColorEstado(
                                  cita.status
                                )}`}
                              >
                                {citasService.obtenerTextoEstado(cita.status)}
                              </div>
                              {typeof (cita as any).sesion === "number" && (
                                <div className="inline-block ml-1 px-2.5 py-1 rounded bg-gray-100 text-gray-700 text-sm">
                                  {(cita as any).sesion} sesiones restantes
                                </div>
                              )}
                              {cita.__reagendada && (
                                <div
                                  className={`inline-block ml-1 px-2.5 py-1 rounded text-sm ${citasService.obtenerColorEstado(
                                    "reagendada"
                                  )}`}
                                >
                                  {citasService.obtenerTextoEstado(
                                    "reagendada"
                                  )}
                                </div>
                              )}
                              <div className="mt-3 flex flex-wrap gap-2">
                                {!restrictActionsById[cita.id] && cita.status !== "confirmada" && (
                                  <button
                                    onClick={() =>
                                      doUpdateStatus(cita.id, "confirmada")
                                    }
                                    disabled={actionId === cita.id}
                                    className="inline-flex items-center px-3 py-1 rounded-md bg-green-600 text-white"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />{" "}
                                    Confirmar
                                  </button>
                                )}
                                {cita.status === "confirmada" &&
                                  typeof (cita as any).sesion === "number" &&
                                  (cita as any).sesion > 0 && (
                                    <button
                                      onClick={() => doDescontarSesion(cita.id)}
                                      disabled={actionId === cita.id}
                                      className="inline-flex items-center px-3 py-1 rounded-md bg-purple-600 text-white"
                                    >
                                      {(cita as any).sesion === 1
                                        ? "Completar"
                                        : "Descontar sesión"}
                                    </button>
                                  )}
                                {!restrictActionsById[cita.id] && cita.status !== "pendiente" && (
                                  <button
                                    onClick={() =>
                                      doUpdateStatus(cita.id, "pendiente")
                                    }
                                    disabled={actionId === cita.id}
                                    className="inline-flex items-center px-3 py-1 rounded-md bg-yellow-500 text-black"
                                  >
                                    Pendiente
                                  </button>
                                )}
                                {!restrictActionsById[cita.id] && cita.status !== "cancelada" && (
                                  <button
                                    onClick={() =>
                                      doUpdateStatus(cita.id, "cancelada")
                                    }
                                    disabled={actionId === cita.id}
                                    className="inline-flex items-center px-3 py-1 rounded-md bg-red-600 text-white"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />{" "}
                                    Cancelar
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSchedId(cita.id);
                                    setSchedDate("");
                                    setSchedTime("");
                                  }}
                                  className="inline-flex items-center px-3 py-1 rounded-md bg-blue-600 text-white"
                                >
                                  <Edit3 className="h-4 w-4 mr-1" /> Reprogramar
                                </button>
                              </div>
                              {completeMsgById[cita.id] && (
                                <div className="mt-2 text-sm text-green-700">
                                  {completeMsgById[cita.id]}
                                </div>
                              )}
                              {schedId === cita.id && (
                                <div className="mt-3 border rounded-md p-3 bg-white">
                                  <div className="mb-2 text-sm font-medium text-gray-800">
                                    Reprogramar cita
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                    <input
                                      type="date"
                                      value={schedDate}
                                      onChange={e =>
                                        setSchedDate(e.target.value)
                                      }
                                      className="px-2 py-2 border rounded-md"
                                    />
                                    <input
                                      type="time"
                                      value={schedTime}
                                      onChange={e =>
                                        setSchedTime(e.target.value)
                                      }
                                      className="px-2 py-2 border rounded-md"
                                    />
                                  </div>
                                  {schedError && (
                                    <div className="text-sm text-red-600">
                                      {schedError}
                                    </div>
                                  )}
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => doReschedule(cita.id)}
                                      disabled={schedLoading}
                                      className="px-3 py-2 rounded-md bg-blue-600 text-white"
                                    >
                                      Guardar
                                    </button>
                                    <button
                                      onClick={() => {
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
                              <div className="mt-3 text-sm text-gray-700"></div>
                            </div>
                          ))}
                          {dayCitas.length === 0 && (
                            <div className="text-gray-600">Sin citas</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {view === "completadas" && (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(citas || [])
                        .filter(
                          c =>
                            String(c?.status || "")
                              ?.toLowerCase()
                              .trim() === "completada"
                        )
                        .sort(
                          (a, b) =>
                            toMs(a?.appointment_date) -
                            toMs(b?.appointment_date)
                        )
                        .map((cita, idx) => (
                          <div
                            key={`${cita.id}-${idx}`}
                            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                          >
                            <div className="text-lg font-semibold text-gray-900 mb-2">
                              {String(cita.service || "")}
                            </div>
                            <div className="flex items-center mb-2">
                              <Calendar className="h-5 w-5 text-pink-600 mr-2" />
                              <span className="text-gray-800 font-semibold">
                                {citasService.formatearFecha(
                                  cita.appointment_date
                                )}
                              </span>
                            </div>
                            <div className="flex items-center mb-2">
                              <Clock className="h-5 w-5 text-pink-600 mr-2" />
                              <span className="text-gray-700">
                                {citasService.formatearHora(
                                  cita.appointment_date
                                )}
                              </span>
                            </div>
                            <div className="flex items-center mb-2">
                              <User className="h-5 w-5 text-gray-600 mr-2" />
                              <span className="text-gray-700">
                                {getNombre(cita as any)}
                              </span>
                            </div>
                            {getEmail(cita) && (
                              <div className="flex items-center mb-2">
                                <Mail className="h-5 w-5 text-gray-600 mr-2" />
                                <span className="text-gray-700">
                                  {getEmail(cita)}
                                </span>
                              </div>
                            )}
                            {getTelefono(cita) && (
                              <div className="flex items-center mb-2">
                                <Phone className="h-5 w-5 text-gray-600 mr-2" />
                                <span className="text-gray-700">
                                  {getTelefono(cita)}
                                </span>
                              </div>
                            )}
                            <div
                              className={`inline-block px-3 py-1 rounded ${citasService.obtenerColorEstado(
                                cita.status
                              )}`}
                            >
                              {citasService.obtenerTextoEstado(cita.status)}
                            </div>
                          </div>
                        ))}
                      {(citas || []).filter(
                        c =>
                          String(c?.status || "")
                            ?.toLowerCase()
                            .trim() === "completada"
                      ).length === 0 && (
                        <div className="text-gray-600">
                          No hay citas completadas.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
