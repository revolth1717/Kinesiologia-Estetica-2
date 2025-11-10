export default function FAQPage() {
  const faqs = [
    {
      q: "¿Cómo funciona el pago con Webpay?",
      a: "Webpay es una plataforma de pago segura de Transbank. Al confirmar tu compra, serás redirigido a Webpay para ingresar los datos de tu tarjeta (crédito o débito). Una vez aprobado el pago, te devolvemos al sitio y registramos tus citas automáticamente.",
    },
    {
      q: "¿Puedo cambiar o cancelar mi cita?",
      a: "Sí. Desde la sección ‘Mis Citas’ puedes cancelar citas pendientes. Si necesitas reprogramar, contáctanos o utiliza la opción de reagendar cuando esté disponible. Te recomendamos realizar cambios con al menos 24 horas de anticipación.",
    },
    {
      q: "¿Qué cobertura o garantías tienen los tratamientos?",
      a: "Nuestros tratamientos están realizados por profesionales certificados y con equipos avalados. Los resultados pueden variar según la evaluación inicial y constancia del paciente. Te entregamos recomendaciones de cuidado y seguimiento para maximizar resultados.",
    },
  ];

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Preguntas Frecuentes</h1>
        <p className="text-gray-600 mb-10">Resolvemos las dudas más comunes sobre pagos, cambios de cita y cobertura.</p>

        <div className="space-y-6">
          {faqs.map((item, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">{item.q}</h2>
              <p className="text-gray-700 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-sm text-gray-500">
          <p>
            ¿Aún tienes preguntas? Escríbenos y te ayudamos a elegir el tratamiento adecuado y agendar tu hora.
          </p>
        </div>
      </div>
    </div>
  );
}