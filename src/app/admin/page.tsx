"use client";

import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  User,
  Settings,
  Calendar,
  ClipboardList,
  Package,
  Shield,
} from "lucide-react";

export default function AdminPage() {
  const { user } = useAuth();
  return (
    <ProtectedRoute adminOnly={true}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white rounded-full p-3">
                    <Settings className="h-8 w-8 text-pink-600" />
                  </div>
                  <div className="ml-4">
                    <h1 className="text-2xl font-bold text-white">
                      Panel de Administración
                    </h1>
                    <p className="text-pink-100">
                      Gestión de contenido y citas
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 text-white px-4 py-2 rounded-md">
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      <span className="capitalize">
                        {user?.nombre || user?.email}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/20 text-white px-4 py-2 rounded-md capitalize">
                    {user?.role || "administrador"}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-6">
              <p className="text-gray-700">Accesos rápidos</p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <a
                  href="/admin/citas"
                  className="block bg-gray-50 border border-gray-200 rounded-lg p-6 hover:border-pink-300 transition-colors"
                >
                  <div className="flex items-center mb-3">
                    <Calendar className="h-6 w-6 text-pink-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-800">
                      Citas
                    </h3>
                  </div>
                  <p className="text-gray-600">
                    Visualizar y gestionar las reservas.
                  </p>
                </a>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:border-pink-300 transition-colors">
                  <div className="flex items-center mb-3">
                    <ClipboardList className="h-6 w-6 text-pink-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-800">
                      Tratamientos
                    </h3>
                  </div>
                  <p className="text-gray-600">
                    Administrar tratamientos y zonas.
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:border-pink-300 transition-colors">
                  <div className="flex items-center mb-3">
                    <Package className="h-6 w-6 text-pink-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-800">
                      Productos
                    </h3>
                  </div>
                  <p className="text-gray-600">Gestionar catálogo y stock.</p>
                </div>
              </div>
              <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <Shield className="h-6 w-6 text-purple-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Estado
                  </h3>
                </div>
                <p className="text-gray-600">
                  Acceso concedido para cuentas con rol administrador.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
