import Link from "next/link";
import { Phone, Mail, MapPin, Instagram, Facebook } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Información de contacto */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-pink-400">Kinesiología Estética</h3>
            <ul className="space-y-3">
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-pink-400" />
                <span>+56 9 1234 5678</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-pink-400" />
                <span>contacto@kinesiologiaestetica.cl</span>
              </li>
              <li className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-pink-400" />
                <span>Av. Principal 123, Santiago, Chile</span>
              </li>
            </ul>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-pink-400">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-pink-400 transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/tratamientos" className="hover:text-pink-400 transition-colors">
                  Tratamientos
                </Link>
              </li>
              <li>
                <Link href="/agendar" className="hover:text-pink-400 transition-colors">
                  Agendar Cita
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-pink-400 transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Redes sociales */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-pink-400">Síguenos</h3>
            <div className="flex space-x-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors">
                <Facebook className="h-6 w-6" />
              </a>
            </div>
            <p className="mt-4">
              Horario de atención:<br />
              Lunes a Viernes: 9:00 - 19:00<br />
              Sábados: 10:00 - 14:00
            </p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Kinesiología Estética. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;