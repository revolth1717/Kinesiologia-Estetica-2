export interface Cita {
  id: number;
  appointment_date: string | number; // timestamp que incluye fecha y hora
  service: string;
  status: "confirmada" | "pendiente" | "cancelada" | "completada";
  user_id: number;
  comments?: string;
  created_at?: string | number;
}

export interface NuevaCita {
  appointment_date: string | number; // ISO string o milisegundos
  service: string;
  sesion?: number;
  comments?: string;
}

// Usar backend local que proxia a Xano y adjunta cookie HttpOnly automáticamente
const API_LOCAL_BASE = "/api/appointment";

class CitasService {
  private lastUserCitasCache: { data: Cita[]; ts: number } | null = null;
  private readonly USER_CITAS_TTL_MS = 10000; // 10s para evitar 429 por múltiples clics

  private getAuthHeaders() {
    return {
      "Content-Type": "application/json",
    };
  }

  // Normalizar una cita para asegurar consistencia en el estado
  private normalizarCita(cita: any): Cita {
    // Clonar y normalizar el campo status (puede venir en mayúsculas desde backend)
    const status =
      typeof cita?.status === "string"
        ? cita.status.toLowerCase().trim()
        : "pendiente";
    return {
      id: cita.id,
      appointment_date: cita.appointment_date,
      service: cita.service,
      status: status as Cita["status"],
      user_id: cita.user_id,
      comments: cita.comments,
      created_at: cita.created_at,
    };
  }

  // Obtener todas las citas del usuario autenticado (DB-only)
  async obtenerCitasUsuario(): Promise<Cita[]> {
    try {
      // Usar caché corto para evitar saturar el backend
      const now = Date.now();
      if (
        this.lastUserCitasCache &&
        now - this.lastUserCitasCache.ts < this.USER_CITAS_TTL_MS
      ) {
        return this.lastUserCitasCache.data;
      }
      // Consultar citas del usuario a través del backend local
      const response = await fetch(`${API_LOCAL_BASE}/user`, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        if ([401, 403].includes(response.status)) {
          throw new Error("No autorizado. Inicia sesión para ver tus citas.");
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const citas = await response.json();
      // Asegurar que los estados estén en minúsculas para la UI
      if (Array.isArray(citas)) {
        const data = citas.map((c: any) => this.normalizarCita(c));
        this.lastUserCitasCache = { data, ts: now };
        return data;
      }
      // Si el backend devolviera un objeto único, normalizar y envolver en array
      if (citas && typeof citas === "object") {
        const data = [this.normalizarCita(citas)];
        this.lastUserCitasCache = { data, ts: now };
        return data;
      }
      const data: Cita[] = [];
      this.lastUserCitasCache = { data, ts: now };
      return data;
    } catch (error) {
      console.error("Error al obtener citas del usuario:", error);
      throw error;
    }
  }

  // Obtener horarios ocupados globales para una fecha (formato YYYY-MM-DD)
  async obtenerDisponibilidad(date: string): Promise<string[]> {
    try {
      // Feature flag para activar/desactivar disponibilidad global
      const enableGlobal =
        (
          process.env.NEXT_PUBLIC_ENABLE_GLOBAL_AVAILABILITY || "true"
        ).toLowerCase() === "true";
      if (!enableGlobal) {
        return [];
      }
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
        throw new Error("Fecha inválida. Usa formato YYYY-MM-DD");
      }
      const qs = new URLSearchParams();
      qs.set("date", String(date));
      qs.set("tz", "America/Santiago");

      const res = await fetch(`/api/availability?${qs.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        // Silenciar a debug para no llenar la consola en la UI
        console.debug("Availability proxy error", res.status, res.statusText);
        return [];
      }
      const data = await res.json();
      const taken = Array.isArray((data as any)?.taken_times)
        ? (data as any).taken_times
        : [];
      return taken.filter((t: any) => typeof t === "string");
    } catch (err) {
      console.debug("Error obteniendo disponibilidad global:", err);
      return [];
    }
  }

  // Crear una nueva cita (DB-only)
  async crearCita(nuevaCita: NuevaCita): Promise<Cita> {
    try {
      // Convertir siempre a ISO UTC para el backend (evita desfases de día)
      const toIso = (v: string | number) => {
        if (typeof v === "number") return new Date(v).toISOString();
        const s = String(v).trim();
        if (/^\d+$/.test(s)) {
          const num = parseInt(s, 10);
          const ms = s.length >= 13 ? num : num * 1000;
          return new Date(ms).toISOString();
        }
        return new Date(s).toISOString();
      };
      const payload = {
        ...nuevaCita,
        appointment_date: toIso(nuevaCita.appointment_date),
        sesion:
          typeof (nuevaCita as any).sesion === "number"
            ? (nuevaCita as any).sesion
            : undefined,
      };
      // Crear cita a través del backend local
      const response = await fetch(`${API_LOCAL_BASE}`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if ([401, 403].includes(response.status)) {
          throw new Error(
            "No autorizado. Inicia sesión para agendar una cita."
          );
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const cita = await response.json();
      return this.normalizarCita(cita);
    } catch (error) {
      console.error("Error al crear cita:", error);
      throw error;
    }
  }

  // Actualizar una cita existente
  async actualizarCita(
    id: number,
    datosActualizados: Partial<Cita>
  ): Promise<Cita> {
    try {
      const payload: any = { ...datosActualizados };
      if (typeof payload.status !== "undefined") {
        payload.status = String(payload.status).toUpperCase();
      }
      payload.appointment_id = id;
      if (typeof payload.appointment_date !== "undefined") {
        const v = payload.appointment_date as any;
        const toXanoInput = (val: any) => {
          try {
            if (typeof val === "number") return val;
            const s = String(val || "").trim();
            if (/^\d+$/.test(s)) {
              const num = parseInt(s, 10);
              const ms = s.length >= 13 ? num : num * 1000;
              return ms;
            }
            return s;
          } catch {
            return val;
          }
        };
        payload.appointment_date = toXanoInput(v);
      }
      const response = await fetch(`${API_LOCAL_BASE}/${id}`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const txt = await response.text().catch(() => "");
        throw new Error(
          `Error ${response.status}: ${response.statusText}${txt ? ` - ${txt}` : ""
          }`
        );
      }

      const cita = await response.json();
      return this.normalizarCita(cita);
    } catch (error) {
      console.error("Error al actualizar cita:", error);
      throw error;
    }
  }

  async actualizarEstado(id: number, status: Cita["status"]): Promise<Cita> {
    try {
      let sesionValue: number | undefined;
      try {
        const list = await this.obtenerCitasUsuario();
        const cita = list.find(c => c.id === id);
        if (cita && typeof (cita as any).sesion === "number") {
          sesionValue = (cita as any).sesion;
        } else if (cita && typeof cita.comments === "string") {
          const m = cita.comments.match(/sesiones?\s*[:\-]?\s*(\d+)/i);
          if (m && m[1]) {
            const n = parseInt(m[1], 10);
            if (!Number.isNaN(n)) sesionValue = n;
          }
        }
      } catch { }
      if (typeof sesionValue !== "number") {
        throw new Error(
          "Falta el campo 'sesion' en la cita para actualizar el estado"
        );
      }
      const payload: any = { status, sesion: sesionValue };
      return this.actualizarCita(id, payload);
    } catch (err) {
      throw err;
    }
  }

  async reprogramarCita(
    id: number,
    appointmentDate: string | number,
    currentStatus?: Cita["status"]
  ): Promise<Cita> {
    const payload: Partial<Cita> = { appointment_date: appointmentDate } as any;
    if (currentStatus) (payload as any).status = currentStatus;
    return this.actualizarCita(id, payload);
  }

  async cancelarCita(id: number, sesion?: number): Promise<void> {
    try {
      let sesionValue: number | undefined =
        typeof sesion === "number" ? sesion : undefined;
      if (typeof sesionValue === "undefined") {
        try {
          const list = await this.obtenerCitasUsuario();
          const cita = list.find(c => c.id === id);
          if (cita && typeof cita.comments === "string") {
            const m = cita.comments.match(/sesiones?\s*[:\-]?\s*(\d+)/i);
            if (m && m[1]) {
              const n = parseInt(m[1], 10);
              if (!Number.isNaN(n)) sesionValue = n;
            }
          }
        } catch { }
      }
      if (typeof sesionValue === "undefined") sesionValue = 1;
      const response = await fetch(`${API_LOCAL_BASE}/${id}`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          appointment_id: id,
          status: "CANCELADA",
          sesion: sesionValue,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
          `Error ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ""
          }`
        );
      }
      this.lastUserCitasCache = null;
    } catch (error) {
      console.error("Error al cancelar cita:", error);
      throw error;
    }
  }

  // Eliminar una cita (DB-only)
  async eliminarCita(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_LOCAL_BASE}/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
          `Error ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ""
          }`
        );
      }
      // Invalidar caché para que la lista se actualice inmediatamente
      this.lastUserCitasCache = null;
    } catch (error) {
      console.error("Error al eliminar cita:", error);
      throw error;
    }
  }

  // Formatear fecha para mostrar (acepta ISO string, milisegundos o segundos)
  formatearFecha(appointmentDate: string | number): string {
    try {
      const date = (() => {
        if (typeof appointmentDate === "number")
          return new Date(appointmentDate);
        const s = String(appointmentDate).trim();
        // Si viene como YYYY-MM-DD (sin hora), parsear como fecha LOCAL
        const m = s.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/);
        if (m) {
          const yy = parseInt(m[1], 10);
          const mm = parseInt(m[2], 10);
          const dd = parseInt(m[3], 10);
          return new Date(yy, mm - 1, dd);
        }
        if (/^\d+$/.test(s)) {
          // Si es sólo dígitos, asumir milisegundos si longitud >=13, si no, segundos
          const num = parseInt(s, 10);
          const ms = s.length >= 13 ? num : num * 1000;
          return new Date(ms);
        }
        return new Date(s);
      })();
      return date.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return String(appointmentDate);
    }
  }

  // Formatear hora para mostrar (acepta ISO string, milisegundos o segundos)
  formatearHora(appointmentDate: string | number): string {
    try {
      const date = (() => {
        if (typeof appointmentDate === "number")
          return new Date(appointmentDate);
        const s = String(appointmentDate).trim();
        // Si viene como YYYY-MM-DD (sin hora), mostrar hora vacía/00:00 local implícita
        const m = s.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/);
        if (m) {
          const yy = parseInt(m[1], 10);
          const mm = parseInt(m[2], 10);
          const dd = parseInt(m[3], 10);
          return new Date(yy, mm - 1, dd);
        }
        if (/^\d+$/.test(s)) {
          const num = parseInt(s, 10);
          const ms = s.length >= 13 ? num : num * 1000;
          return new Date(ms);
        }
        return new Date(s);
      })();
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return String(appointmentDate);
    }
  }

  // Obtener el color del estado
  obtenerColorEstado(estado: string): string {
    const e = (estado || "").toLowerCase().trim();
    switch (e) {
      case "confirmada":
        return "bg-green-500 text-black ring-1 ring-green-400 dark:bg-green-500 dark:text-black dark:ring-green-400";
      case "pendiente":
        return "bg-yellow-400 text-black ring-1 ring-yellow-300 dark:bg-yellow-400 dark:text-black dark:ring-yellow-300";
      case "cancelada":
        return "bg-red-500 text-black ring-1 ring-red-400 dark:bg-red-500 dark:text-black dark:ring-red-400";
      case "completada":
        return "bg-red-600 text-white ring-1 ring-red-500 dark:bg-red-600 dark:text-white dark:ring-red-500";
      case "reagendada":
        return "bg-blue-500 text-white ring-1 ring-blue-400 dark:bg-blue-500 dark:text-white dark:ring-blue-400";
      default:
        return "bg-gray-100 text-gray-900 ring-1 ring-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600";
    }
  }

  // Obtener el texto del estado
  obtenerTextoEstado(estado: string): string {
    const e = (estado || "").toLowerCase().trim();
    switch (e) {
      case "confirmada":
        return "Confirmada";
      case "pendiente":
        return "Pendiente";
      case "cancelada":
        return "Cancelada";
      case "completada":
        return "Completada";
      case "reagendada":
        return "Reagendada";
      default:
        return "Desconocido";
    }
  }
}

export const citasService = new CitasService();

