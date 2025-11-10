"use client";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Star, Award, Users, ChevronLeft, ChevronRight, CreditCard, ShieldCheck } from "lucide-react";
import TrustBadges from "@/components/TrustBadges";
import { useEffect, useMemo, useState } from "react";

export default function Home() {
  // Fuentes para el carrusel del hero: 4 fotos locales de tratamientos
  const heroImages = useMemo(
    () => [
      { src: "/images/tratamientos/laserlipolisis.jpg", alt: "Laserlipolisis" },
      { src: "/images/tratamientos/cavitacion.jpg", alt: "Cavitación" },
      { src: "/images/tratamientos/facialconradiofrecuencia.jpg", alt: "Facial con radiofrecuencia" },
      { src: "/images/tratamientos/depilacionlaser.jpg", alt: "Depilación láser" },
    ],
    []
  );

  const [active, setActive] = useState(0);
  const ROTATION_MS = Number(process.env.NEXT_PUBLIC_HOME_HERO_ROTATION_MS) || 5000;
  // Auto-rotación suave cada 4s
  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % heroImages.length);
    }, ROTATION_MS);
    return () => clearInterval(id);
  }, [heroImages.length, ROTATION_MS]);
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Kinesiología Estética Profesional
              </h1>
              <p className="text-xl mb-8">
                Servicios de estética y bienestar para todos los tipos de clientes.
                Mejora tu calidad de vida con nuestros tratamientos personalizados.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/tratamientos"
                  className="bg-white text-pink-600 hover:bg-gray-100 px-6 py-3 rounded-md font-medium text-center"
                >
                  Ver Tratamientos
                </Link>
                <Link
                  href="/agendar"
                  className="bg-transparent border-2 border-white hover:bg-white hover:text-pink-600 px-6 py-3 rounded-md font-medium transition-colors text-center"
                >
                  Agendar Cita
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-full h-64 md:h-96">
                <div className="absolute inset-0 bg-pink-200 rounded-lg transform rotate-3"></div>
                <div className="absolute inset-0 bg-white rounded-lg">
                  <div className="w-full h-full relative overflow-hidden rounded-lg">
                    {/* Slides */}
                    {heroImages.map((img, idx) => (
                      <Image
                        key={img.src}
                        src={img.src}
                        alt={img.alt}
                        fill
                        priority={idx === active}
                        className={`object-cover transition-opacity duration-700 ${idx === active ? "opacity-100" : "opacity-0"}`}
                      />
                    ))}

                    {/* Controles */}
                    <button
                      aria-label="Anterior"
                      onClick={() => setActive((active - 1 + heroImages.length) % heroImages.length)}
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

                    {/* Indicadores */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                      {heroImages.map((_, i) => (
                        <button
                          key={i}
                          aria-label={`Ir a la imagen ${i + 1}`}
                          onClick={() => setActive(i)}
                          className={`w-2.5 h-2.5 rounded-full ${i === active ? "bg-pink-600" : "bg-pink-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Características */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            ¿Por qué elegirnos?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-pink-50 p-6 rounded-lg text-center">
              <div className="mx-auto w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Experiencia Profesional</h3>
              <p className="text-gray-600">
                Contamos con profesionales altamente calificados y con años de experiencia en el área.
              </p>
            </div>
            <div className="bg-pink-50 p-6 rounded-lg text-center">
              <div className="mx-auto w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Tecnología Avanzada</h3>
              <p className="text-gray-600">
                Utilizamos equipos de última generación para garantizar los mejores resultados.
              </p>
            </div>
            <div className="bg-pink-50 p-6 rounded-lg text-center">
              <div className="mx-auto w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Atención Personalizada</h3>
              <p className="text-gray-600">
                Cada tratamiento se adapta a las necesidades específicas de cada cliente.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* CTA Agendar */}
      <section className="py-16 bg-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para mejorar tu bienestar?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Agenda una cita hoy mismo y comienza tu camino hacia una mejor versión de ti.
          </p>
          <Link
            href="/agendar"
            className="bg-white text-pink-600 hover:bg-gray-100 px-8 py-4 rounded-md font-medium inline-flex items-center"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Agendar una Cita
          </Link>
        </div>
      </section>

      {/* Tratamientos al final */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">Tratamientos</h2>
          <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            Conoce nuestros tratamientos más solicitados y accede a sus detalles.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: "Laserlipolisis", slug: "laserlipolisis", img: "/images/tratamientos/laserlipolisis.jpg" },
              { name: "Cavitación", slug: "cavitacion", img: "/images/tratamientos/cavitacion.jpg" },
              { name: "Facial con Radiofrecuencia", slug: "facialconradiofrecuencia", img: "/images/tratamientos/facialconradiofrecuencia.jpg" },
              { name: "Depilación Láser", slug: "depilacionlaser", img: "/images/tratamientos/depilacionlaser.jpg" },
            ].map((t) => (
              <div key={t.slug} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <div className="h-40 bg-pink-200 relative overflow-hidden">
                  <Image src={t.img} alt={t.name} fill className="object-cover" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">{t.name}</h3>
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
              className="bg-pink-600 text-white hover:bg-pink-700 px-6 py-3 rounded-md font-medium inline-block"
            >
              Ver todos los tratamientos
            </Link>
          </div>
        </div>
      </section>

      {/* Información de pagos - Webpay */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">Información de Pagos</h2>
          <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            Aceptamos pagos seguros a través de Webpay. Puedes pagar con tarjetas
            de crédito y débito, y contamos con medidas de seguridad para proteger tus datos.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg text-center shadow">
              <div className="mx-auto w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Medios de pago</h3>
              <p className="text-gray-600">Tarjetas de crédito y débito (Webpay).</p>
            </div>
            <div className="bg-white p-6 rounded-lg text-center shadow">
              <div className="mx-auto w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Pago seguro</h3>
              <p className="text-gray-600">Transacciones protegidas y encriptadas a través de Webpay.</p>
            </div>
            <div className="bg-white p-6 rounded-lg text-center shadow">
              <div className="mx-auto w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Comodidad</h3>
              <p className="text-gray-600">Paga rápido desde tu dispositivo sin complicaciones.</p>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-8">
            Nota: Esta es información de referencia. La integración de pago en línea se habilita
            en el flujo de compra y agendamiento cuando corresponda.
          </p>
          <TrustBadges />
        </div>
      </section>
    </div>
  );
}
