import React from "react";

export const metadata = {
  title: "Contacto | Kinesiología Estética",
  description:
    "Página de contacto para Kinesiología Estética: teléfono, WhatsApp, email y formulario de consulta.",
};

function ContactInfo() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold">Datos de contacto</h2>
        <ul className="mt-4 space-y-2 text-sm text-gray-700">
          <li>
            Teléfono: <a className="text-blue-600" href="tel:+56982287166">+56 9 8228 7166</a>
          </li>
          <li>
            WhatsApp: <a className="text-blue-600" href="https://wa.me/56982287166" target="_blank" rel="noopener noreferrer">Enviar mensaje</a>
          </li>
          <li>
            Email: <a className="text-blue-600" href="mailto:info@kinesiologia-estetica.com">info@kinesiologia-estetica.com</a>
          </li>
          <li>
            Dirección: Camino Carlos vial infante 1368, lote 6. Pirque
          </li>
          <li>
            Horarios: Lunes a Viernes, 9:00–18:00
          </li>
        </ul>
      </div>
      <div className="rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold">Ubicación</h2>
        <p className="mt-4 text-sm text-gray-700">
          Estamos ubicados en una zona céntrica. Podés escribirnos por WhatsApp para coordinar tu visita o consultar por turnos disponibles.
        </p>
        <div className="mt-4">
          <div className="w-full h-64 md:h-80">
            <iframe
              title="Mapa: Camino Carlos vial infante 1368, lote 6. Pirque"
              src="https://www.google.com/maps?q=Camino%20Carlos%20vial%20infante%201368%2C%20lote%206.%20Pirque&output=embed"
              className="w-full h-full rounded-md"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <a
            href="https://www.google.com/maps/search/?api=1&query=Camino%20Carlos%20vial%20infante%201368%2C%20lote%206.%20Pirque"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Ver en Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ContactoPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold">Contacto</h1>
      <p className="mt-2 text-sm text-gray-700">
        Comunicate con nuestro equipo para consultas, turnos y más información.
      </p>
      <div className="mt-8 space-y-8">
        <ContactInfo />
      </div>
    </main>
  );
}
