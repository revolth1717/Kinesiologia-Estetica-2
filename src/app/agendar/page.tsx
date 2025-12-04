"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { Calendar, Clock, User, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { citasService, type NuevaCita } from "@/services/citasService";
import { useCart } from "@/context/CartContext";
import { useRouter, useSearchParams } from "next/navigation";
import { generateSlots, isPastSlot } from "@/utils/timeSlots";

// Horarios disponibles (simulados)
const horariosDisponibles = {
  "2023-06-01": ["10:00", "11:00", "12:00", "16:00", "17:00"],
  "2023-06-02": ["09:00", "10:00", "15:00", "16:00", "17:00"],
  "2023-06-03": ["10:00", "11:00", "12:00", "15:00"],
  "2023-06-04": ["09:00", "10:00", "11:00", "16:00", "17:00"],
  "2023-06-05": ["10:00", "11:00", "15:00", "16:00"],
};

function AgendarContent() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const { addItem } = useCart();

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tratamiento, setTratamiento] = useState("");
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const searchParams = useSearchParams();

  type TratamientoItem = {
    id: number;
    nombre: string;
    slug?: string;
    tipo: "unico" | "multi_zona";
    precio_1_sesion?: number;
    precio_8_sesiones?: number;
    imagen_url?: any;
    duracion_minutos?: number;
  };

  // Fallback local para imágenes de tratamientos (mismo esquema que /tratamientos)
  const LOCAL_TREATMENT_IMAGES: Record<string, string> = {
    laserlipolisis: "laserlipolisis.jpg",
    cavitacion: "cavitacion.jpg",
    facialconradiofrecuencia: "facialconradiofrecuencia.jpg",
    depilacionlaser: "depilacionlaser.jpg",
  };

  function normalizeName(name?: string): string | undefined {
    if (!name) return undefined;
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "");
  }

  // Por defecto en false para preferir las imágenes reales del tratamiento
  const USE_LOCAL_IMAGES_ONLY =
    (process.env.NEXT_PUBLIC_USE_LOCAL_TREATMENT_IMAGES ?? "false") === "true";

  function getLocalFallback(t?: TratamientoItem): string | undefined {
    if (!t) return undefined;
    const slugKey = t.slug;
    const nameKey = normalizeName(t.nombre);
    const fileName =
      (slugKey ? LOCAL_TREATMENT_IMAGES[slugKey] : undefined) ||
      (nameKey ? LOCAL_TREATMENT_IMAGES[nameKey] : undefined);
    return fileName ? `/api/local-images?file=${fileName}` : undefined;
  }

  function getImageSrc(t?: TratamientoItem): string | undefined {
    if (!t) return undefined;
    const img = t.imagen_url;
    if (!img) return getLocalFallback(t);
    if (typeof img === "string") return img || getLocalFallback(t);
    if (typeof img === "object") {
      if (img.url && typeof img.url === "string") return img.url;
      if (img.path && typeof img.path === "string") {
        if (img.path.startsWith("http")) return img.path;
        const base = process.env.NEXT_PUBLIC_CONTENT_API_URL || "";
        return base ? `${base}${img.path}` : img.path;
      }
    }
    return getLocalFallback(t);
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const CONTENT_API_URL = process.env.NEXT_PUBLIC_CONTENT_API_URL || API_URL;
  const TREATMENTS_PATH =
    process.env.NEXT_PUBLIC_TREATMENTS_PATH || "/tratamientos";
  const LOCAL_TREATMENTS_URL = "/api/tratamientos";
  const ZONES_SEGMENT = process.env.NEXT_PUBLIC_ZONES_SEGMENT || "zonas";
  const ZONES_BY_TREATMENT_PATH =
    process.env.NEXT_PUBLIC_ZONES_BY_TREATMENT_PATH || "/zonas-por-tratamiento";
  const LOCAL_ZONES_BY_TREATMENT = "/api/zonas-por-tratamiento";

  const [tratamientosList, setTratamientosList] = useState<TratamientoItem[]>(
    []
  );
  const [loadingTrat, setLoadingTrat] = useState(true);
  const [errorTrat, setErrorTrat] = useState<string | null>(null);

  type ZonaItem = {
    id: number;
    nombre: string;
    precio_1_sesion?: number;
    precio_8_sesiones?: number;
  };
  const [zonasList, setZonasList] = useState<ZonaItem[]>([]);
  const [zonaId, setZonaId] = useState<string>("");
  const [loadingZonas, setLoadingZonas] = useState(false);
  const [errorZonas, setErrorZonas] = useState<string | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<1 | 8>(1);

  // Formateador de CLP sin decimales
  const formatCLP = (value?: number) => {
    if (typeof value !== "number") return "—";
    try {
      return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `$${value.toLocaleString()}`;
    }
  };

  // Helper: fetch con timeout para evitar bloqueos cuando el API no responde
  const fetchWithTimeout = async (
    url: string,
    ms = 1500
  ): Promise<Response> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    try {
      const res = await fetch(url, { signal: controller.signal });
      return res;
    } finally {
      clearTimeout(id);
    }
  };

  // Estados para manejo de imágenes
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Llenar datos automáticamente si el usuario está logueado
  useEffect(() => {
    if (isLoggedIn && user) {
      setName(user.nombre || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      console.log("Agendar prefill:", { user, phoneSelected: user.phone });
    }
  }, [isLoggedIn, user]);

  // Preseleccionar tratamiento desde query param
  useEffect(() => {
    const q = searchParams.get("tratamiento");
    if (q && !tratamiento) {
      setTratamiento(q);
    }
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    const didFetch = { current: false } as { current: boolean };
    const loadTratamientos = async () => {
      try {
        const res = await fetch(LOCAL_TREATMENTS_URL, {
          signal: controller.signal,
        });
        if (res.status === 404) {
          setTratamientosList([]);
          setErrorTrat(null);
          return;
        }
        if (res.status === 429) {
          // Esperar breve y reintentar una vez para evitar límite por doble render
          await new Promise(r => setTimeout(r, 800));
          const retry = await fetch(LOCAL_TREATMENTS_URL, {
            signal: controller.signal,
          });
          if (!retry.ok) throw new Error(`Error ${retry.status}`);
          const data = await retry.json();
          const list = Array.isArray(data)
            ? data
            : data.items ?? data.results ?? [];
          console.log("Tratamientos cargados (retry):", list);
          setTratamientosList(list);
          return;
        }
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : data.items ?? data.results ?? [];

        console.log("Tratamientos cargados:", list);
        setTratamientosList(list);
      } catch (e: any) {
        if (
          e?.name === "AbortError" ||
          (typeof e?.message === "string" && e.message.includes("Abort"))
        ) {
          // Ignorar abortos provocados por doble render en modo desarrollo
          return;
        }
        setErrorTrat(e.message || "Error cargando tratamientos");
      } finally {
        setLoadingTrat(false);
      }
    };
    // Evitar doble llamada en modo desarrollo (Strict Mode) que provoca 429
    if (!didFetch.current) {
      didFetch.current = true;
      loadTratamientos();
    }
    return () => {
      controller.abort();
    };
  }, []);

  // Tratamiento seleccionado (por slug o id)
  const selectedTrat = tratamientosList.find(
    t => (t.slug ?? t.id).toString() === tratamiento
  );

  // Imagen del tratamiento seleccionado (mismas fuentes que en /tratamientos)
  const localFallback = useMemo(
    () => getLocalFallback(selectedTrat),
    [selectedTrat]
  );
  const selectedImgSrc = useMemo(() => {
    if (!selectedTrat) return null;
    const src = USE_LOCAL_IMAGES_ONLY
      ? localFallback
      : getImageSrc(selectedTrat) || localFallback;
    return src ?? null;
  }, [selectedTrat, localFallback]);

  // Resetear estado de imagen cuando cambie el tratamiento
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [selectedTrat]);

  // Cargar zonas cuando el tratamiento es multi_zona usando proxy local para evitar CORS
  useEffect(() => {
    if (selectedTrat?.tipo === "multi_zona" && selectedTrat.id) {
      setLoadingZonas(true);
      setErrorZonas(null);
      setZonaId("");

      const loadZonas = async () => {
        const url = `${LOCAL_ZONES_BY_TREATMENT}?id=${selectedTrat.id}`;
        try {
          console.log("Cargando zonas via proxy:", url);
          const res = await fetchWithTimeout(url, 3000);
          if (!res.ok) throw new Error(`Error ${res.status}`);
          const data = await res.json();
          const list = Array.isArray(data)
            ? data
            : data.items ?? data.results ?? data.data ?? data.zonas ?? [];
          if (Array.isArray(list)) {
            setZonasList(list);
            setErrorZonas(null);
            console.log("Zonas cargadas:", list);
            setLoadingZonas(false);
            return;
          }
          throw new Error("Respuesta sin lista de zonas");
        } catch (e: any) {
          console.warn("Fallo al cargar zonas", url, e?.message || e);
          setErrorZonas(e?.message || "Error cargando zonas");
          setLoadingZonas(false);
        }
      };

      loadZonas();
    } else {
      setZonasList([]);
      setLoadingZonas(false);
      setZonaId("");
    }
  }, [selectedTrat, API_URL]);

  // Helper para formatear YYYY-MM-DD en horario LOCAL
  const toLocalYMD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Generar fechas disponibles (próximos 8 días) en LOCAL
  const availableDates = Array.from({ length: 8 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return toLocalYMD(date);
  });

  const getPlaceholderImage = (treatmentName: string) => {
    return `https://via.placeholder.com/400x400/f3f4f6/9ca3af?text=${encodeURIComponent(
      treatmentName || "Tratamiento"
    )}`;
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime("");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleSubmitCita = async () => {
    // Requerir inicio de sesión antes de agendar
    if (!isLoggedIn) {
      setSubmitError("Debes iniciar sesión para agendar tu cita.");
      router.push("/login");
      return;
    }
    if (!selectedDate || !selectedTime || !name || !email || !tratamiento) {
      setSubmitError("Por favor completa todos los campos requeridos");
      return;
    }

    if (!selectedTrat || (selectedTrat.tipo === "multi_zona" && !zonaId)) {
      setSubmitError("Por favor selecciona un tratamiento válido");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      // Preparar datos de la cita
      let servicioNombre = selectedTrat.nombre;
      if (selectedTrat.tipo === "multi_zona" && zonaId) {
        const selectedZona = zonasList.find(z => z.id.toString() === zonaId);
        servicioNombre += ` - ${selectedZona?.nombre || ""}`;
      }
      servicioNombre += ` (${selectedSessions} ${selectedSessions === 1 ? "sesión" : "sesiones"
        })`;

      // Construir fecha y hora en horario LOCAL para evitar desfases por UTC
      const [year, month, day] = selectedDate.split("-").map(Number);
      const [hour, minute] = selectedTime.split(":").map(Number);
      const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);

      const nuevaCita: NuevaCita = {
        // Enviar milisegundos locales para que el backend los registre correctamente
        appointment_date: localDate.getTime(),
        service: servicioNombre,
        comments: `Tratamiento: ${selectedTrat.nombre}${selectedTrat.tipo === "multi_zona" && zonaId
          ? ` - Zona: ${zonasList.find(z => z.id.toString() === zonaId)?.nombre
          }`
          : ""
          }\nSesiones: ${selectedSessions}\nContacto: ${name} - ${email} - ${phone}`,
      };
      // Calcular precios
      let price: number | undefined;
      if (selectedTrat.tipo === "multi_zona") {
        const z = zonasList.find(z => z.id.toString() === zonaId);
        price =
          selectedSessions === 1 ? z?.precio_1_sesion : z?.precio_8_sesiones;
      } else {
        price =
          selectedSessions === 1
            ? selectedTrat.precio_1_sesion
            : selectedTrat.precio_8_sesiones;
      }
      const deposit = typeof price === "number" ? Math.round(price * 0.5) : 0;

      // Agregar al carrito y redirigir a carrito
      addItem({
        id: `${Date.now()}`,
        tratamiento: selectedTrat.nombre,
        zona:
          selectedTrat.tipo === "multi_zona"
            ? zonasList.find(z => z.id.toString() === zonaId)?.nombre
            : undefined,
        sesiones: selectedSessions,
        fecha: selectedDate,
        hora: selectedTime,
        precioTotal: price || 0,
        precioAgenda: deposit,
        nuevaCita,
      });

      router.push("/carrito");
    } catch (error) {
      console.error("Error al crear cita:", error);
      setSubmitError("Error al agendar la cita. Por favor intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cargar horas ocupadas (carrito, usuario y disponibilidad global) para la fecha seleccionada
  useEffect(() => {
    const loadBooked = async () => {
      try {
        if (!selectedDate) {
          setBookedTimes([]);
          return;
        }
        const times: string[] = [];
        // Horas del carrito para esa fecha
        try {
          // Acceso seguro a localStorage del carrito por si el provider no cargó aún
          const raw = localStorage.getItem("cartItems");
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              for (const it of arr) {
                if (
                  String(it?.fecha) === selectedDate &&
                  typeof it?.hora === "string"
                ) {
                  times.push(it.hora);
                }
              }
            }
          }
        } catch { }

        // Horas ya agendadas por el usuario autenticado
        if (isLoggedIn) {
          const citas = await citasService
            .obtenerCitasUsuario()
            .catch(() => []);
          for (const c of citas) {
            if ((c.status || "").toLowerCase().trim() === "cancelada") continue;
            const d = (() => {
              if (typeof c.appointment_date === "number")
                return new Date(c.appointment_date);
              const s = String(c.appointment_date).trim();
              if (/^\d+$/.test(s)) {
                const num = parseInt(s, 10);
                const ms = s.length >= 13 ? num : num * 1000;
                return new Date(ms);
              }
              return new Date(s);
            })();
            const y = d.getFullYear();
            const m = d.getMonth() + 1;
            const day = d.getDate();
            const ymd = `${y}-${String(m).padStart(2, "0")}-${String(
              day
            ).padStart(2, "0")}`;
            if (ymd === selectedDate) {
              const hh = String(d.getHours()).padStart(2, "0");
              const mm = String(d.getMinutes()).padStart(2, "0");
              times.push(`${hh}:${mm}`);
            }
          }
        }

        // Horarios ocupados globales desde backend (Xano)
        const takenGlobal = await citasService
          .obtenerDisponibilidad(selectedDate)
          .catch(() => []);
        for (const t of takenGlobal) {
          if (typeof t === "string") times.push(t);
        }

        // Normalizar y deduplicar
        const unique = Array.from(new Set(times.sort()));
        setBookedTimes(unique);
      } catch {
        setBookedTimes([]);
      }
    };
    loadBooked();
  }, [selectedDate, isLoggedIn]);

  const handleNextStep = () => {
    if (step === 1 && selectedDate && selectedTime) {
      setStep(2);
    } else if (
      step === 2 &&
      name &&
      email &&
      phone &&
      tratamiento &&
      (!selectedTrat || selectedTrat.tipo !== "multi_zona" || zonaId)
    ) {
      // Requerir autenticación para continuar a confirmar
      if (!isLoggedIn) {
        setSubmitError(
          "Debes iniciar sesión para confirmar y agendar tu cita."
        );
        return;
      }
      setStep(3); // Nuevo paso de confirmación
    }
  };

  if (submitSuccess) {
    return (
      <div className="py-12 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                ¡Cita Agendada Exitosamente!
              </h1>
              <p className="text-gray-600">
                Tu cita ha sido programada correctamente
              </p>
            </div>

            <div className="bg-green-50 p-6 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-800 mb-4">
                Detalles de tu cita:
              </h3>
              <div className="text-left space-y-2">
                <p>
                  <span className="font-medium">Fecha:</span>{" "}
                  {(() => {
                    const [yy, mm, dd] = selectedDate.split("-").map(Number);
                    const d = new Date(yy, mm - 1, dd);
                    return d.toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    });
                  })()}
                </p>
                <p>
                  <span className="font-medium">Hora:</span> {selectedTime}
                </p>
                <p>
                  <span className="font-medium">Tratamiento:</span>{" "}
                  {selectedTrat?.nombre}
                </p>
                {selectedTrat?.tipo === "multi_zona" && zonaId && (
                  <p>
                    <span className="font-medium">Zona:</span>{" "}
                    {zonasList.find(z => z.id.toString() === zonaId)?.nombre}
                  </p>
                )}
                <p>
                  <span className="font-medium">Sesiones:</span>{" "}
                  {selectedSessions}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {isLoggedIn ? (
                <p className="text-gray-600">
                  Serás redirigido a tu perfil en unos segundos...
                </p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">
                    ¿Quieres ver todas tus citas? Crea una cuenta o inicia
                    sesión
                  </p>
                  <div className="space-x-4">
                    <button
                      onClick={() => router.push("/login")}
                      className="bg-pink-600 text-white hover:bg-pink-700 px-6 py-3 rounded-md font-medium"
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      onClick={() => router.push("/registro")}
                      className="bg-gray-600 text-white hover:bg-gray-700 px-6 py-3 rounded-md font-medium"
                    >
                      Crear Cuenta
                    </button>
                  </div>
                </div>
              )}

              {/* Selector de sesiones y detalle de precio del tratamiento */}
              {selectedTrat && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Detalle de precio
                    </h4>
                    <div
                      className="inline-flex rounded-md shadow-sm"
                      role="group"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedSessions(1)}
                        className={`px-3 py-1 text-sm border ${selectedSessions === 1
                          ? "bg-pink-600 text-white border-pink-600"
                          : "bg-white text-gray-700 border-gray-300"
                          } rounded-l-md`}
                      >
                        1 sesión
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSessions(8)}
                        className={`px-3 py-1 text-sm border ${selectedSessions === 8
                          ? "bg-pink-600 text-white border-pink-600"
                          : "bg-white text-gray-700 border-gray-300"
                          } rounded-r-md`}
                      >
                        8 sesiones
                      </button>
                    </div>
                  </div>

                  <div className="border rounded-md p-4 bg-gray-50">
                    <p className="text-gray-800 mb-1">
                      <span className="font-medium">Tratamiento:</span>{" "}
                      {selectedTrat.nombre}
                    </p>
                    {selectedTrat.tipo === "multi_zona" && (
                      <p className="text-gray-800 mb-2">
                        <span className="font-medium">Zona:</span>{" "}
                        {zonasList.find(z => z.id.toString() === zonaId)
                          ?.nombre || "—"}
                      </p>
                    )}

                    {selectedTrat.tipo === "multi_zona" ? (
                      <>
                        <div className="flex justify-between">
                          <span>1 sesión</span>
                          <span className="text-pink-600 font-semibold">
                            {formatCLP(
                              zonasList.find(z => z.id.toString() === zonaId)
                                ?.precio_1_sesion
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span>8 sesiones</span>
                          <span className="text-pink-600 font-semibold">
                            {formatCLP(
                              zonasList.find(z => z.id.toString() === zonaId)
                                ?.precio_8_sesiones
                            )}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span>1 sesión</span>
                          <span className="text-pink-600 font-semibold">
                            {formatCLP(selectedTrat.precio_1_sesion)}
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span>8 sesiones</span>
                          <span className="text-pink-600 font-semibold">
                            {formatCLP(selectedTrat.precio_8_sesiones)}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="border-t mt-3 pt-3">
                      <div className="flex justify-between">
                        <span className="font-medium">
                          Precio total (
                          {selectedSessions === 1 ? "1 sesión" : "8 sesiones"})
                        </span>
                        <span className="text-pink-700 font-semibold">
                          {(() => {
                            if (selectedTrat.tipo === "multi_zona") {
                              const z = zonasList.find(
                                z => z.id.toString() === zonaId
                              );
                              const value =
                                selectedSessions === 1
                                  ? z?.precio_1_sesion
                                  : z?.precio_8_sesiones;
                              return formatCLP(value);
                            } else {
                              const value =
                                selectedSessions === 1
                                  ? selectedTrat.precio_1_sesion
                                  : selectedTrat.precio_8_sesiones;
                              return formatCLP(value);
                            }
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm text-gray-700">
                          Precio agenda (50%)
                        </span>
                        <span className="text-pink-600 font-semibold">
                          {(() => {
                            let value: number | undefined;
                            if (selectedTrat.tipo === "multi_zona") {
                              const z = zonasList.find(
                                z => z.id.toString() === zonaId
                              );
                              value =
                                selectedSessions === 1
                                  ? z?.precio_1_sesion
                                  : z?.precio_8_sesiones;
                            } else {
                              value =
                                selectedSessions === 1
                                  ? selectedTrat.precio_1_sesion
                                  : selectedTrat.precio_8_sesiones;
                            }
                            const deposit =
                              typeof value === "number"
                                ? Math.round(value * 0.5)
                                : undefined;
                            return formatCLP(deposit);
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Eliminado botón adicional de "Volver al inicio" para evitar duplicado en el paso 3 */}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Agenda tu Cita
          </h1>
          <div className="mb-6 bg-pink-50 border border-pink-100 text-pink-800 px-4 py-3 rounded">
            ¿Dudas sobre pago, cambios de cita o cobertura?{" "}
            <a href="/faq" className="underline font-medium">
              Consulta las Preguntas Frecuentes
            </a>
            .
          </div>
          <p className="text-gray-600">
            Selecciona la fecha y hora que prefieras para tu tratamiento
          </p>
          {isLoggedIn && (
            <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md flex items-center justify-center">
              <User className="h-5 w-5 mr-2" />
              {(() => {
                const nombre = user?.nombre?.trim();
                const email = user?.email?.trim();
                if (nombre && email)
                  return `Agendando como: ${nombre} (${email})`;
                if (nombre) return `Agendando como: ${nombre}`;
                if (email) return `Agendando como: ${email}`;
                return "Agendando como: Usuario";
              })()}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Pasos actualizados */}
          <div className="flex items-center justify-center mb-8">
            <div
              className={`flex items-center ${step >= 1 ? "text-pink-600" : "text-gray-400"
                }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1
                  ? "bg-pink-600 text-white"
                  : "bg-gray-200 text-gray-600"
                  }`}
              >
                1
              </div>
              <span className="ml-2 font-medium">Fecha y Hora</span>
            </div>
            <div className="w-16 h-1 mx-4 bg-gray-200">
              <div
                className={`h-full ${step >= 2 ? "bg-pink-600" : "bg-gray-200"
                  }`}
                style={{ width: step >= 2 ? "100%" : "0%" }}
              ></div>
            </div>
            <div
              className={`flex items-center ${step >= 2 ? "text-pink-600" : "text-gray-400"
                }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2
                  ? "bg-pink-600 text-white"
                  : "bg-gray-200 text-gray-600"
                  }`}
              >
                2
              </div>
              <span className="ml-2 font-medium">Datos Personales</span>
            </div>
            <div className="w-16 h-1 mx-4 bg-gray-200">
              <div
                className={`h-full ${step >= 3 ? "bg-pink-600" : "bg-gray-200"
                  }`}
                style={{ width: step >= 3 ? "100%" : "0%" }}
              ></div>
            </div>
            <div
              className={`flex items-center ${step >= 3 ? "text-pink-600" : "text-gray-400"
                }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3
                  ? "bg-pink-600 text-white"
                  : "bg-gray-200 text-gray-600"
                  }`}
              >
                3
              </div>
              <span className="ml-2 font-medium">Confirmar</span>
            </div>
          </div>

          {/* Paso 3: Confirmación */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-semibold mb-6 text-center">
                Confirma tu cita
              </h3>

              {submitError && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {submitError}
                </div>
              )}

              <div className="bg-pink-50 dark:bg-gray-800 p-6 rounded-md mb-6 border-2 border-pink-300 dark:border-pink-500 shadow">
                <h4 className="font-medium text-gray-800 mb-4">
                  Resumen de tu cita:
                </h4>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <span className="font-medium">Fecha:</span>{" "}
                    {(() => {
                      const [yy, mm, dd] = String(selectedDate)
                        .split("-")
                        .map(Number);
                      const d = new Date(yy, mm - 1, dd);
                      return d.toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      });
                    })()}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Hora:</span> {selectedTime}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Tratamiento:</span>{" "}
                    {selectedTrat?.nombre || "—"}
                  </p>
                  {selectedTrat?.tipo === "multi_zona" && zonaId && (
                    <p className="text-gray-700">
                      <span className="font-medium">Zona:</span>{" "}
                      {zonasList.find(z => z.id.toString() === zonaId)
                        ?.nombre || "—"}
                    </p>
                  )}
                  <p className="text-gray-700">
                    <span className="font-medium">Sesiones:</span>{" "}
                    {selectedSessions}{" "}
                    {selectedSessions === 1 ? "sesión" : "sesiones"}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Precio agenda (50%):</span>{" "}
                    {(() => {
                      if (!selectedTrat) return "—";
                      let value: number | undefined;
                      if (selectedTrat.tipo === "multi_zona") {
                        const z = zonasList.find(
                          z => z.id.toString() === zonaId
                        );
                        value =
                          selectedSessions === 1
                            ? z?.precio_1_sesion
                            : z?.precio_8_sesiones;
                        if (!zonaId) return "—";
                      } else {
                        value =
                          selectedSessions === 1
                            ? selectedTrat.precio_1_sesion
                            : selectedTrat.precio_8_sesiones;
                      }
                      const deposit =
                        typeof value === "number"
                          ? Math.round(value * 0.5)
                          : undefined;
                      return formatCLP(deposit);
                    })()}
                  </p>
                  <div className="border-t pt-2 mt-4 border-gray-200 dark:border-gray-700">
                    <p className="text-gray-700">
                      <span className="font-medium">Nombre:</span> {name}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Email:</span> {email}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Teléfono:</span> {phone}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-700 font-medium"
                >
                  Volver
                </button>
                <button
                  onClick={handleSubmitCita}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-pink-600 text-white rounded-md hover:bg-pink-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Agendando...
                    </>
                  ) : (
                    "Confirmar Cita"
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-pink-600" />
                  Selecciona una fecha
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {availableDates.map(date => (
                    <button
                      key={date}
                      onClick={() => handleDateSelect(date)}
                      className={`p-3 rounded-md border ${selectedDate === date
                        ? "bg-pink-600 text-white border-pink-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-pink-400"
                        }`}
                    >
                      {(() => {
                        const [yy, mm, dd] = date.split("-").map(Number);
                        const localD = new Date(yy, mm - 1, dd);
                        return localD.toLocaleDateString("es-ES", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        });
                      })()}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDate && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-pink-600" />
                    Selecciona una hora
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {generateSlots({ dateYMD: selectedDate }).map(time => {
                      const isTaken = bookedTimes.includes(time);
                      const isPast = isPastSlot(selectedDate, time);
                      const disabled = isTaken || isPast;
                      const classes = disabled
                        ? "p-3 rounded-md border bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        : selectedTime === time
                          ? "p-3 rounded-md border bg-pink-600 text-white border-pink-600"
                          : "p-3 rounded-md border bg-white text-gray-700 border-gray-300 hover:border-pink-400";
                      return (
                        <button
                          key={time}
                          onClick={() => !disabled && handleTimeSelect(time)}
                          disabled={disabled}
                          aria-disabled={disabled}
                          className={classes}
                          title={
                            isTaken
                              ? "Horario ocupado"
                              : isPast
                                ? "Horario pasado"
                                : "Seleccionar horario"
                          }
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    {bookedTimes.length > 0 && (
                      <p>
                        {bookedTimes.length} horario
                        {bookedTimes.length === 1 ? "" : "s"} ya ocupado
                        {bookedTimes.length === 1 ? "" : "s"} hoy.
                      </p>
                    )}
                    {selectedTime && (
                      <p>
                        Selección:{" "}
                        {(() => {
                          const [yy, mm, dd] = selectedDate
                            .split("-")
                            .map(Number);
                          const d = new Date(yy, mm - 1, dd);
                          return d.toLocaleDateString("es-ES", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          });
                        })()}{" "}
                        a las {selectedTime}.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              {/* Aviso de autenticación requerida */}
              {!isLoggedIn && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
                  <p className="mb-3">
                    Para agendar una cita necesitas iniciar sesión o crear una
                    cuenta.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => router.push("/login")}
                      className="bg-pink-600 text-white hover:bg-pink-700 px-4 py-2 rounded-md font-medium"
                    >
                      Iniciar sesión
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/registro")}
                      className="bg-gray-600 text-white hover:bg-gray-700 px-4 py-2 rounded-md font-medium"
                    >
                      Crear cuenta
                    </button>
                  </div>
                </div>
              )}
              <div className="mb-6">
                <label
                  htmlFor="tratamiento"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tratamiento
                </label>
                <select
                  id="tratamiento"
                  value={tratamiento}
                  onChange={e => setTratamiento(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                >
                  <option value="">Selecciona un tratamiento</option>
                  {loadingTrat && (
                    <option disabled>Cargando tratamientos…</option>
                  )}
                  {errorTrat && <option disabled>Error al cargar</option>}
                  {!loadingTrat &&
                    !errorTrat &&
                    tratamientosList.map(t => (
                      <option key={t.id} value={(t.slug ?? t.id).toString()}>
                        {t.nombre}
                      </option>
                    ))}
                </select>
              </div>

              {selectedImgSrc && (
                <div className="mb-6">
                  <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={selectedImgSrc}
                      alt={`Tratamiento: ${selectedTrat?.nombre ?? "seleccionado"
                        }`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={e => {
                        if (
                          localFallback &&
                          e.currentTarget.src !== localFallback
                        ) {
                          e.currentTarget.src = localFallback;
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {selectedTrat?.tipo === "multi_zona" && (
                <div className="mb-6">
                  <label
                    htmlFor="zona"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Zona
                  </label>
                  <select
                    id="zona"
                    value={zonaId}
                    onChange={e => setZonaId(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  >
                    <option value="">Selecciona una zona</option>
                    {loadingZonas && <option disabled>Cargando zonas…</option>}
                    {errorZonas && (
                      <option disabled>Error al cargar zonas</option>
                    )}
                    {!loadingZonas &&
                      !errorZonas &&
                      zonasList.map(z => (
                        <option key={z.id} value={z.id.toString()}>
                          {z.nombre}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Precio en vivo según tratamiento/zona y selector de sesiones */}
              {selectedTrat && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Detalle de precio
                    </h4>
                    <div
                      className="inline-flex rounded-md shadow-sm"
                      role="group"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedSessions(1)}
                        className={`px-3 py-1 text-sm border ${selectedSessions === 1
                          ? "bg-pink-600 text-white border-pink-600"
                          : "bg-white text-gray-700 border-gray-300"
                          } rounded-l-md`}
                      >
                        1 sesión
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSessions(8)}
                        className={`px-3 py-1 text-sm border ${selectedSessions === 8
                          ? "bg-pink-600 text-white border-pink-600"
                          : "bg-white text-gray-700 border-gray-300"
                          } rounded-r-md`}
                      >
                        8 sesiones
                      </button>
                    </div>
                  </div>

                  <div className="border rounded-md p-4 bg-gray-50">
                    <p className="text-gray-800 mb-1">
                      <span className="font-medium">Tratamiento:</span>{" "}
                      {selectedTrat.nombre}
                    </p>
                    {selectedTrat.tipo === "multi_zona" && (
                      <p className="text-gray-800 mb-2">
                        <span className="font-medium">Zona:</span>{" "}
                        {zonasList.find(z => z.id.toString() === zonaId)
                          ?.nombre || (zonaId ? "—" : "Selecciona una zona")}
                      </p>
                    )}

                    {selectedTrat.tipo === "multi_zona" ? (
                      zonaId ? (
                        <>
                          <div className="flex justify-between">
                            <span>1 sesión</span>
                            <span className="text-pink-600 font-semibold">
                              {formatCLP(
                                zonasList.find(z => z.id.toString() === zonaId)
                                  ?.precio_1_sesion
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span>8 sesiones</span>
                            <span className="text-pink-600 font-semibold">
                              {formatCLP(
                                zonasList.find(z => z.id.toString() === zonaId)
                                  ?.precio_8_sesiones
                              )}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-600 italic">
                          Elige una zona para ver precios
                        </div>
                      )
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span>1 sesión</span>
                          <span className="text-pink-600 font-semibold">
                            {formatCLP(selectedTrat.precio_1_sesion)}
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span>8 sesiones</span>
                          <span className="text-pink-600 font-semibold">
                            {formatCLP(selectedTrat.precio_8_sesiones)}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="border-t mt-3 pt-3">
                      <div className="flex justify-between">
                        <span className="font-medium">
                          Precio total (
                          {selectedSessions === 1 ? "1 sesión" : "8 sesiones"})
                        </span>
                        <span className="text-pink-700 font-semibold">
                          {(() => {
                            if (selectedTrat.tipo === "multi_zona") {
                              const z = zonasList.find(
                                z => z.id.toString() === zonaId
                              );
                              const value =
                                selectedSessions === 1
                                  ? z?.precio_1_sesion
                                  : z?.precio_8_sesiones;
                              return zonaId ? formatCLP(value) : "—";
                            } else {
                              const value =
                                selectedSessions === 1
                                  ? selectedTrat.precio_1_sesion
                                  : selectedTrat.precio_8_sesiones;
                              return formatCLP(value);
                            }
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm text-gray-700">
                          Precio agenda (50%)
                        </span>
                        <span className="text-pink-600 font-semibold">
                          {(() => {
                            let value: number | undefined;
                            if (selectedTrat.tipo === "multi_zona") {
                              const z = zonasList.find(
                                z => z.id.toString() === zonaId
                              );
                              value =
                                selectedSessions === 1
                                  ? z?.precio_1_sesion
                                  : z?.precio_8_sesiones;
                              if (!zonaId) return "—";
                            } else {
                              value =
                                selectedSessions === 1
                                  ? selectedTrat.precio_1_sesion
                                  : selectedTrat.precio_8_sesiones;
                            }
                            const deposit =
                              typeof value === "number"
                                ? Math.round(value * 0.5)
                                : undefined;
                            return formatCLP(deposit);
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                    disabled={isLoggedIn}
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                    disabled={isLoggedIn}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>

              {isLoggedIn && (
                <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
                  <p className="text-sm">
                    Los datos se han llenado automáticamente desde tu perfil.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between mt-8">
            {step > 1 && step < 3 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-700 font-medium"
              >
                Volver
              </button>
            )}

            {step < 3 && (
              <button
                onClick={handleNextStep}
                disabled={
                  (step === 1 && (!selectedDate || !selectedTime)) ||
                  (step === 2 &&
                    (!name ||
                      !email ||
                      !phone ||
                      !tratamiento ||
                      (selectedTrat?.tipo === "multi_zona" && !zonaId) ||
                      !isLoggedIn))
                }
                className={`px-6 py-3 rounded-md font-medium ${(step === 1 && (!selectedDate || !selectedTime)) ||
                  (step === 2 &&
                    (!name ||
                      !email ||
                      !phone ||
                      !tratamiento ||
                      (selectedTrat?.tipo === "multi_zona" && !zonaId) ||
                      !isLoggedIn))
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-pink-600 text-white hover:bg-pink-700"
                  } ${step === 1 ? "ml-auto" : ""}`}
              >
                Continuar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgendarPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-gray-600">Cargando…</p>
          </div>
        </div>
      }
    >
      <AgendarContent />
    </Suspense>
  );
}
