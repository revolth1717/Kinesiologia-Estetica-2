"use client";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Star,
  Award,
  Users,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import TrustBadges from "@/components/TrustBadges";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  // Fuentes para el carrusel del hero: 4 fotos locales de tratamientos
  const heroImages = useMemo(
    () => [
      { src: "/images/tratamientos/laserlipolisis.jpg", alt: "Laserlipolisis" },
      { src: "/images/tratamientos/cavitacion.jpg", alt: "Cavitación" },
      {
        src: "/images/tratamientos/facialconradiofrecuencia.jpg",
        alt: "Facial con radiofrecuencia",
      },
      {
        src: "/images/tratamientos/depilacionlaser.jpg",
        alt: "Depilación láser",
      },
    ],
    []
  );

  const [active, setActive] = useState(0);
  const ROTATION_MS =
    Number(process.env.NEXT_PUBLIC_HOME_HERO_ROTATION_MS) || 5000;
  // Auto-rotación suave cada 4s
  useEffect(() => {
    const id = setInterval(() => {
      setActive(prev => (prev + 1) % heroImages.length);
    }, ROTATION_MS);
    return () => clearInterval(id);
  }, [heroImages.length, ROTATION_MS]);
  const { isLoggedIn } = useAuth();
  useEffect(() => {
    const controller = new AbortController();
    const CONTENT_API_URL = process.env.NEXT_PUBLIC_CONTENT_API_URL || "";
    const PRODUCT_DIR =
      process.env.NEXT_PUBLIC_PRODUCT_IMAGES_DIR || "/productos";

    const LOCAL_TREATMENT_IMAGES: Record<string, string> = {
      laserlipolisis: "laserlipolisis.jpg",
      cavitacion: "cavitacion.jpg",
      facialconradiofrecuencia: "facialconradiofrecuencia.jpg",
      depilacionlaser: "depilacionlaser.jpg",
    };

    const normalizeName = (name?: string): string | undefined => {
      if (!name) return undefined;
      return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "");
    };

    const getLocalTreatmentFallback = (
      t: Record<string, unknown>
    ): string | undefined => {
      const slugKey = typeof t.slug === "string" ? t.slug : undefined;
      const nameKey = normalizeName(
        typeof t.nombre === "string" ? t.nombre : undefined
      );
      const fileName =
        (slugKey ? LOCAL_TREATMENT_IMAGES[slugKey] : undefined) ||
        (nameKey ? LOCAL_TREATMENT_IMAGES[nameKey] : undefined);
      return fileName ? `/api/local-images?file=${fileName}` : undefined;
    };

    const getTreatmentImageSrc = (
      t: Record<string, unknown>
    ): string | undefined => {
      const fallback = getLocalTreatmentFallback(t);
      const img = t.imagen_url;
      if (typeof img === "string" && img) return img;
      if (img && typeof img === "object") {
        const o = img as Record<string, unknown>;
        const url = typeof o.url === "string" ? o.url : undefined;
        if (url) return url;
        const path = typeof o.path === "string" ? o.path : undefined;
        if (path) {
          if (path.startsWith("http")) return path;
          return CONTENT_API_URL ? `${CONTENT_API_URL}${path}` : path;
        }
      }
      return fallback;
    };

    const slugify = (s: string): string =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const getProductCandidates = (item: Record<string, unknown>): string[] => {
      const candidates: string[] = [];
      const direct =
        typeof item.imagen_url === "string"
          ? (item.imagen_url as string)
          : undefined;
      if (direct) candidates.push(direct);
      const imgObj =
        item.imagen_url && typeof item.imagen_url === "object"
          ? (item.imagen_url as Record<string, unknown>)
          : undefined;
      const objUrl =
        imgObj && typeof imgObj.url === "string"
          ? (imgObj.url as string)
          : undefined;
      if (objUrl) candidates.push(objUrl);
      const name =
        typeof item.nombre === "string" ? (item.nombre as string) : "producto";
      const base = slugify(name);
      ["jpg", "jpeg", "png", "webp"].forEach(ext => {
        candidates.push(`${PRODUCT_DIR}/${base}.${ext}`);
      });
      return candidates;
    };

    const safeList = (data: unknown): Record<string, unknown>[] => {
      if (Array.isArray(data)) return data as Record<string, unknown>[];
      if (data && typeof data === "object") {
        const o = data as Record<string, unknown>;
        const keys = ["items", "results", "data"] as const;
        for (const k of keys) {
          const v = o[k];
          if (Array.isArray(v)) return v as Record<string, unknown>[];
        }
      }
      return [];
    };

    const prefetchImage = (url?: string) => {
      if (!url) return;
      try {
        const img = new Image();
        img.decoding = "async";
        img.src = url;
      } catch {}
    };

    const prefetch = async () => {
      try {
        const trRes = await fetch("/api/tratamientos", {
          signal: controller.signal,
        });
        if (trRes.ok) {
          const trData = await trRes.json();
          const trList = safeList(trData);
          trList
            .slice(0, 12)
            .forEach(t => prefetchImage(getTreatmentImageSrc(t)));
        }
      } catch {}
      try {
        const prRes = await fetch("/api/productos", {
          signal: controller.signal,
        });
        if (prRes.ok) {
          const prData = await prRes.json();
          const prList = safeList(prData);
          prList.slice(0, 12).forEach(p => {
            const candidates = getProductCandidates(p);
            prefetchImage(candidates[0]);
          });
        }
      } catch {}
      if (isLoggedIn) {
        try {
          await fetch("/api/appointment/user", {
            signal: controller.signal,
            credentials: "include",
          });
        } catch {}
      }
    };
    prefetch();
    return () => controller.abort();
  }, [isLoggedIn]);
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-6 sm:py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-6 md:gap-8">
            <div className="flex justify-center mb-8 md:mb-0 z-10">
              <div className="relative w-full h-64 sm:h-72 md:h-96 overflow-hidden rounded-lg">
                <div className="absolute inset-0 bg-pink-200 rounded-lg transform rotate-1 sm:rotate-2 md:rotate-3"></div>
                <div className="absolute inset-0 bg-white rounded-lg shadow-lg">
                  <div className="w-full h-full relative">
                    {heroImages.map((img, idx) => (
                      <Image
                        key={img.src}
                        src={img.src}
                        alt={img.alt}
                        fill
                        priority={idx === active}
                        className={`object-cover transition-opacity duration-700 ${
                          idx === active ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    ))}
                    <button
                      aria-label="Anterior"
                      onClick={() =>
                        setActive(
                          (active - 1 + heroImages.length) % heroImages.length
                        )
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-pink-700 rounded-full p-2 shadow"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      aria-label="Siguiente"
                      onClick={() =>
                        setActive((active + 1) % heroImages.length)
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-pink-700 rounded-full p-2 shadow"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                      {heroImages.map((_, i) => (
                        <button
                          key={i}
                          aria-label={`Ir a la imagen ${i + 1}`}
                          onClick={() => setActive(i)}
                          className={`w-2.5 h-2.5 rounded-full ${
                            i === active ? "bg-pink-600" : "bg-pink-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-10 md:mb-0">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Kinesiología Estética Profesional
              </h1>
              <p className="text-xl mb-8">
                Servicios de estética y bienestar para todos los tipos de
                clientes. Mejora tu calidad de vida con nuestros tratamientos
                personalizados.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/tratamientos"
                  className="bg-white text-pink-600 hover:bg-gray-100 dark:hover:bg-gray-100 hover:text-gray-900 px-6 py-3 rounded-md font-medium text-center border border-pink-600/40 hover:border-pink-600 dark:hover:border-white dark:hover:text-white transition-all duration-200 transform hover:scale-[1.02] hover:shadow-md"
                  prefetch
                >
                  Ver Tratamientos
                </Link>
                <Link
                  href="/tratamientos"
                  className="bg-transparent border-2 border-white hover:bg-gray-100 dark:hover:bg-transparent hover:text-pink-600 dark:hover:text-white dark:hover:border-white px-6 py-3 rounded-md font-medium transition-colors text-center"
                  prefetch
                >
                  Ver Productos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Características */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-gray-100">
            ¿Por qué elegirnos?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg text-center border border-gray-200 dark:border-gray-700 transition-shadow hover:shadow-md">
              <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
                Experiencia Profesional
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Contamos con profesionales altamente calificados y con años de
                experiencia en el área.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg text-center border border-gray-200 dark:border-gray-700 transition-shadow hover:shadow-md">
              <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
                Tecnología Avanzada
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Utilizamos equipos de última generación para garantizar los
                mejores resultados.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg text-center border border-gray-200 dark:border-gray-700 transition-shadow hover:shadow-md">
              <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
                Atención Personalizada
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Cada tratamiento se adapta a las necesidades específicas de cada
                cliente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Agendar */}
      <section className="py-16 bg-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            ¿Listo para mejorar tu bienestar?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Agenda una cita hoy mismo y comienza tu camino hacia una mejor
            versión de ti.
          </p>
          <Link
            href="/agendar"
            className="bg-white text-pink-600 hover:bg-gray-100 dark:hover:bg-gray-100 hover:text-gray-900 px-8 py-4 rounded-md font-medium inline-flex items-center border border-pink-600/40 hover:border-pink-600 dark:hover:border-white dark:hover:text-white transition-all duration-200 transform hover:scale-[1.02] hover:shadow-md"
            prefetch
          >
            <Calendar className="mr-2 h-5 w-5" />
            Agendar una Cita
          </Link>
        </div>
      </section>

      {/* Tratamientos al final */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-800 dark:text-gray-100">
            Tratamientos
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
            Conoce nuestros tratamientos más solicitados y accede a sus
            detalles.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: "Laserlipolisis",
                slug: "laserlipolisis",
                img: "/images/tratamientos/laserlipolisis.jpg",
              },
              {
                name: "Cavitación",
                slug: "cavitacion",
                img: "/images/tratamientos/cavitacion.jpg",
              },
              {
                name: "Facial con Radiofrecuencia",
                slug: "facialconradiofrecuencia",
                img: "/images/tratamientos/facialconradiofrecuencia.jpg",
              },
              {
                name: "Depilación Láser",
                slug: "depilacionlaser",
                img: "/images/tratamientos/depilacionlaser.jpg",
              },
            ].map(t => (
              <div
                key={t.slug}
                className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-pink-200 dark:border-pink-700 hover:border-pink-400 dark:hover:border-pink-500"
              >
                <div className="h-36 sm:h-48 md:h-56 bg-pink-200 relative overflow-hidden">
                  <Image
                    src={t.img}
                    alt={t.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
                    {t.name}
                  </h3>
                  <Link
                    href={`/tratamientos/${t.slug}`}
                    className="text-pink-600 hover:text-pink-800 font-medium"
                  >
                    Ver detalles
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/tratamientos"
              className="bg-pink-600 text-white hover:bg-pink-800 px-6 py-3 rounded-md font-medium inline-block transition-transform duration-200 transform hover:scale-[1.02] shadow hover:shadow-lg"
              prefetch
            >
              Ver todos los tratamientos
            </Link>
          </div>
        </div>
      </section>

      {/* Información de pagos - Webpay */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-800 dark:text-gray-100">
            Información de Pagos
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
            Aceptamos pagos seguros a través de Webpay. Puedes pagar con
            tarjetas de crédito y débito, y contamos con medidas de seguridad
            para proteger tus datos.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center shadow">
              <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
                Medios de pago
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Tarjetas de crédito y débito (Webpay).
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center shadow">
              <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
                Pago seguro
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Transacciones protegidas y encriptadas a través de Webpay.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center shadow">
              <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
                Comodidad
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Paga rápido desde tu dispositivo sin complicaciones.
              </p>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            Nota: Esta es información de referencia. La integración de pago en
            línea se habilita en el flujo de compra y agendamiento cuando
            corresponda.
          </p>
          <TrustBadges />
        </div>
      </section>
    </div>
  );
}
