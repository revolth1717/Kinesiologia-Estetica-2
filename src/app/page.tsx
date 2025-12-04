"use client";
import Image from "next/image";
import Link from "next/link";
import { Calendar, CreditCard, ShieldCheck } from "lucide-react";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import HeroCarousel from "@/components/HeroCarousel";
import FeaturesSection from "@/components/FeaturesSection";

export default function Home() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  useEffect(() => {
    const r = user?.role;
    const s = r ? String(r).toLowerCase() : "";
    if (isLoggedIn && (s.includes("admin") || s === "administrador")) {
      router.replace("/admin");
      return;
    }
  }, [isLoggedIn, user, router]);
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
        const img = new window.Image();
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
      <HeroCarousel />
      <FeaturesSection />

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

      {/* Información de Pagos - Mercado Pago */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-800 dark:text-gray-100">
            Pagos Seguros con Mercado Pago
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
            Para tu comodidad y seguridad, utilizamos Mercado Pago. Puedes pagar tus productos y reservar tus citas utilizando tus tarjetas de crédito, débito o dinero en cuenta.
          </p>
          <div className="flex justify-center items-center gap-8 flex-wrap">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2 text-blue-600">
                <CreditCard className="h-8 w-8" />
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-200">Tarjetas</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2 text-green-600">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-200">100% Seguro</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
