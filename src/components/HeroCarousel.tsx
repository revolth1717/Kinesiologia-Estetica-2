"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function HeroCarousel() {
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

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % heroImages.length);
    }, ROTATION_MS);
    return () => clearInterval(id);
  }, [heroImages.length, ROTATION_MS]);

  return (
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
                    onClick={() => setActive((active + 1) % heroImages.length)}
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
              Servicios de estética y bienestar para todos los tipos de clientes.
              Mejora tu calidad de vida con nuestros tratamientos
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
  );
}
