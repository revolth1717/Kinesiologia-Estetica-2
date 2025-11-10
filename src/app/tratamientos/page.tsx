"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type XanoFile = {
  url?: string;
  path?: string;
  name?: string;
  mime?: string;
};

type Tratamiento = {
  id: number;
  nombre: string;
  slug?: string;
  tipo: "unico" | "multi_zona";
  precio_1_sesion: number;
  precio_8_sesiones: number;
  duracion_minutos: number;
  imagen_url?: string | XanoFile | null;
};

// Fallback local para imágenes de tratamientos (JPG en /public/images/tratamientos)
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
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

  // Usar proxy local para evitar CORS
  const LOCAL_TREATMENTS_URL = "/api/tratamientos";

  // Modo diagnóstico: usar solo imágenes locales de `public/images/tratamientos`
  // Por defecto en false para preferir las imágenes reales de cada tratamiento
  const USE_LOCAL_IMAGES_ONLY = ((process.env.NEXT_PUBLIC_USE_LOCAL_TREATMENT_IMAGES ?? 'false') === 'true');

  function getLocalFallback(t: Tratamiento): string | undefined {
    const slugKey = t.slug;
    const nameKey = normalizeName(t.nombre);
    const fileName =
      (slugKey ? LOCAL_TREATMENT_IMAGES[slugKey] : undefined) ||
      (nameKey ? LOCAL_TREATMENT_IMAGES[nameKey] : undefined);
    return fileName ? `/api/local-images?file=${fileName}` : undefined;
  }

// Obtiene la URL correcta para la imagen del tratamiento
function getImageSrc(t: Tratamiento): string | undefined {
  const img = t.imagen_url;
  if (!img) return getLocalFallback(t);

  if (typeof img === 'string') return img || getLocalFallback(t);

  // Si viene como objeto de Xano, priorizar 'url'
  if (typeof img === 'object') {
    if (img.url && typeof img.url === 'string') return img.url;
    if (img.path && typeof img.path === 'string') {
      // Si viene sólo 'path', construir URL absoluta con el CONTENT_API_URL público
      if (img.path.startsWith('http')) return img.path;
      const base = process.env.NEXT_PUBLIC_CONTENT_API_URL || '';
      return base ? `${base}${img.path}` : img.path;
    }
  }

  return getLocalFallback(t);
}

export default function TratamientosPage() {
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const didFetch = { current: false } as { current: boolean };
    const load = async () => {
      try {
        const res = await fetch(LOCAL_TREATMENTS_URL, { signal: controller.signal });
        if (res.status === 404) {
          setTratamientos([]);
          setError(null);
          return;
        }
        if (res.status === 429) {
          await new Promise((r) => setTimeout(r, 800));
          const retry = await fetch(LOCAL_TREATMENTS_URL, { signal: controller.signal });
          if (!retry.ok) throw new Error(`Error ${retry.status}`);
          const data = await retry.json();
          const list = Array.isArray(data) ? data : (data.items ?? data.results ?? []);
          setTratamientos(list);
          return;
        }
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.items ?? data.results ?? []);
        setTratamientos(list);
      } catch (e: any) {
        if (e?.name === 'AbortError' || (typeof e?.message === 'string' && e.message.includes('Abort'))) {
          // Ignorar abortos provocados por doble render en modo desarrollo
          return;
        }
        setError(e.message || "Error cargando tratamientos");
      } finally {
        setLoading(false);
      }
    };
    if (!didFetch.current) {
      didFetch.current = true;
      load();
    }
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Nuestros Tratamientos</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Descubre nuestra oferta actual de tratamientos y paquetes.
          </p>
        </div>

        {loading && <p className="text-center text-gray-600">Cargando tratamientos…</p>}
        {error && <p className="text-center text-red-600">Error: {error}</p>}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tratamientos.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="h-48 bg-pink-200 relative overflow-hidden">
                  {(() => {
                    const fallback = getLocalFallback(t);
                    const src = USE_LOCAL_IMAGES_ONLY && fallback ? fallback : (getImageSrc(t) || fallback);
                    return src ? (
                      <img
                        src={src}
                        alt={t.nombre}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          if (fallback && e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback;
                          }
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-pink-600">Sin imagen</span>
                      </div>
                    );
                  })()}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">{t.nombre}</h3>
                  <div className="text-gray-600 mb-4">
                    <div>Duración: {t.duracion_minutos} min</div>
                    <div className="mt-1">Tipo: {t.tipo === "multi_zona" ? "Con zonas" : "Único"}</div>
                  </div>
                  <div className="space-y-1 mb-4">
                    {t.tipo === "multi_zona" ? (
                      <div className="text-center py-2">
                        <span className="text-pink-600 font-semibold italic">
                          Precio depende de la zona a elegir
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span>1 sesión</span>
                          <span className="text-pink-600 font-semibold">${t.precio_1_sesion.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>8 sesiones</span>
                          <span className="text-pink-600 font-semibold">${t.precio_8_sesiones.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {t.tipo === "multi_zona" ? (
                      <Link
                        href={`/agendar?tratamiento=${t.slug ?? t.id}`}
                        className="bg-pink-600 text-white hover:bg-pink-700 px-4 py-2 rounded-md font-medium text-sm flex-1 text-center"
                      >
                        Elegir zona y agendar
                      </Link>
                    ) : (
                      <Link
                        href={`/agendar?tratamiento=${t.slug ?? t.id}`}
                        className="bg-pink-600 text-white hover:bg-pink-700 px-4 py-2 rounded-md font-medium text-sm"
                      >
                        Agendar
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
