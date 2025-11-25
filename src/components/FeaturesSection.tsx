import { Star, Award, Users } from "lucide-react";

export default function FeaturesSection() {
  return (
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
  );
}
