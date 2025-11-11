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
            Teléfono: <a className="text-blue-600" href="tel:+549000000000">+54 9 0000 0000</a>
          </li>
          <li>
            WhatsApp: <a className="text-blue-600" href="https://wa.me/549000000000" target="_blank" rel="noopener noreferrer">Enviar mensaje</a>
          </li>
          <li>
            Email: <a className="text-blue-600" href="mailto:info@kinesiologia-estetica.com">info@kinesiologia-estetica.com</a>
          </li>
          <li>
            Dirección: Av. Ejemplo 123, Ciudad, Provincia
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
          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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