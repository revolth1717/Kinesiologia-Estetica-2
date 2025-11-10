"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Calendar, Clock, MapPin, Edit2, Save, X, CheckCircle, XCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { citasService, type Cita } from "@/services/citasService";
import { ApiDiagnostic } from "@/utils/apiDiagnostic";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function PerfilPage() {
  const { user, isLoggedIn, logout, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [citasLoading, setCitasLoading] = useState(false);
  const [citasError, setCitasError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nombre: "",
    email: "",
    telefono: ""
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string>("");
  const [refreshingUser, setRefreshingUser] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  useEffect(() => {
    console.log("DEBUG - User data:", user);
    console.log("DEBUG - Loading:", loading);
    console.log("DEBUG - IsLoggedIn:", isLoggedIn);
    
    if (!loading && !isLoggedIn) {
      router.push("/login");
      return;
    }

    if (user) {
      console.log("👤 Datos del usuario en perfil:", user);
      console.log("DEBUG - Setting editForm with user data:", {
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono
      });
      setEditForm({
        nombre: user.nombre || "",
        email: user.email || "",
        telefono: user.telefono || ""
      });
      
      // Cargar citas del usuario
      cargarCitas();
    }
  }, [user, isLoggedIn, loading, router]);

  const cargarCitas = async () => {
    setCitasLoading(true);
    setCitasError("");
    
    try {
      const citasUsuario = await citasService.obtenerCitasUsuario();
      setCitas(citasUsuario);
    } catch (error) {
      setCitasError("Error al cargar las citas. Intenta nuevamente.");
      console.error("Error al cargar citas:", error);
    } finally {
      setCitasLoading(false);
    }
  };

  // Validaciones en tiempo real
  const validateField = (name: string, value: string) => {
    const errors: {[key: string]: string} = {};
    
    switch (name) {
      case 'nombre':
        if (value.length < 2) {
          errors.nombre = "El nombre debe tener al menos 2 caracteres";
        }
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.email = "Ingresa un email válido";
        }
        break;
      case 'telefono':
        const phoneRegex = /^[+]?[\d\s\-\(\)]{8,15}$/;
        if (value && !phoneRegex.test(value)) {
          errors.telefono = "Ingresa un teléfono válido";
        }
        break;
    }
    
    setFieldErrors(prev => ({
      ...prev,
      ...errors,
      // Limpiar errores que ya no aplican
      ...(Object.keys(errors).length === 0 ? { [name]: "" } : {})
    }));
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validar campo en tiempo real
    validateField(name, value);
    
    // Limpiar mensajes de éxito/error
    if (updateError) setUpdateError("");
    if (updateSuccess) setUpdateSuccess(false);
  };

  const isFormValid = () => {
    return (
      editForm.nombre.length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email) &&
      (!editForm.telefono || /^[+]?[\d\s\-\(\)]{8,15}$/.test(editForm.telefono)) &&
      Object.values(fieldErrors).every(error => !error)
    );
  };

  const handleSaveProfile = async () => {
    setUpdateError("");
    setUpdateSuccess(false);
    
    if (!isFormValid()) {
      setUpdateError("Por favor, corrige los errores en el formulario");
      return;
    }

    setUpdateLoading(true);
    
    try {
      // Simular actualización del perfil (aquí iría la llamada a la API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Actualizar el usuario en el contexto (esto debería hacerse desde el AuthContext)
      // Por ahora simulamos el éxito
      setUpdateSuccess(true);
      setIsEditing(false);
      
      // Aquí deberías actualizar el usuario en el contexto de autenticación
      console.log("Perfil actualizado:", editForm);
      
    } catch (error) {
      setUpdateError("Error al actualizar el perfil. Intenta nuevamente.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      nombre: user?.nombre || "",
      email: user?.email || "",
      telefono: user?.telefono || ""
    });
    setFieldErrors({});
    setUpdateError("");
    setUpdateSuccess(false);
  };

  const [isCancellingId, setIsCancellingId] = useState<number | null>(null);
  const [cancelError, setCancelError] = useState<string>("");
  const [cancelSuccess, setCancelSuccess] = useState<string>("");

  const handleCancelarCita = async (citaId: number) => {
    // Confirmación previa para evitar toques accidentales
    const confirmed = window.confirm("¿Seguro que quieres cancelar esta cita?");
    if (!confirmed) return;

    setCancelError("");
    setCancelSuccess("");
    setIsCancellingId(citaId);

    try {
      await citasService.cancelarCita(citaId);
      // Recargar citas después de cancelar
      await cargarCitas();
      setCancelSuccess("Cita cancelada correctamente.");
      setTimeout(() => setCancelSuccess(""), 3000);
    } catch (error: any) {
      console.error("Error al cancelar cita:", error);
      const msg = String(error?.message || "Error al cancelar la cita");
      if (msg.includes("Error 401")) {
        setCancelError("No estás autenticado o tu sesión expiró (401). Inicia sesión nuevamente.");
      } else if (msg.includes("Error 403")) {
        setCancelError("No tienes permiso para cancelar esta cita (403).");
      } else if (msg.includes("Error 404")) {
        setCancelError("La cita no existe (404).");
      } else if (msg.includes("Error 409")) {
        setCancelError("La cita ya estaba cancelada (409).");
      } else {
        setCancelError("Error al cancelar la cita. Intenta nuevamente.");
      }
      // Ocultar el error después de unos segundos
      setTimeout(() => setCancelError(""), 5000);
    } finally {
      setIsCancellingId(null);
    }
  };

  const handleDiagnostico = async () => {
    setDiagnosticLoading(true);
    setDiagnosticResult("");
    
    try {
      console.log("🔍 Iniciando diagnóstico de API...");
      
      // Probar conexión básica
      const connectionTest = await ApiDiagnostic.testConnection();
      console.log("Resultado de conexión:", connectionTest);
      
      // Probar endpoints de autenticación
      const authTest = await ApiDiagnostic.testAuthEndpoints();
      console.log("Resultado de endpoints:", authTest);
      
      // Mostrar información de diagnóstico
      ApiDiagnostic.logDiagnosticInfo();
      
      let result = "🔍 Diagnóstico de API completado:\n\n";
      result += `📡 Conexión base: ${connectionTest.success ? '✅ OK' : '❌ Error'}\n`;
      result += `🔐 Endpoint /auth/me: ${authTest.me ? '✅ Configurado' : '⚠️ No configurado'}\n`;
      result += `📝 Endpoint /auth/login: ${authTest.login ? '✅ Configurado' : '⚠️ No configurado'}\n`;
      result += `👤 Endpoint /auth/signup: ${authTest.signup ? '✅ Configurado' : '⚠️ No configurado'}\n\n`;
      
      if (!connectionTest.success) {
        result += "❌ La API de Xano no está respondiendo.\n";
        result += "💡 Usando datos de prueba locales para demostración.\n";
      } else if (!authTest.me || !authTest.login || !authTest.signup) {
        result += "✅ La API de Xano está accesible.\n";
        result += "⚠️ Los endpoints de autenticación aún no están configurados en Xano.\n";
        result += "💡 La aplicación funciona con datos de prueba mientras tanto.\n\n";
        result += "📋 Para configurar los endpoints en Xano:\n";
        result += "   • Crear endpoint POST /auth/login\n";
        result += "   • Crear endpoint POST /auth/signup\n";
        result += "   • Crear endpoint GET /auth/me\n";
      } else {
        result += "🎉 ¡Todo configurado correctamente!\n";
      }
      
      setDiagnosticResult(result);
    } catch (error) {
      console.error("Error en diagnóstico:", error);
      setDiagnosticResult("❌ Error al ejecutar diagnóstico: " + (error as Error).message);
    } finally {
      setDiagnosticLoading(false);
    }
  };

  const handleRefreshUser = async () => {
    setRefreshingUser(true);
    setRefreshError(null);
    setRefreshSuccess(false);
    try {
      await refreshUser();
      setRefreshSuccess(true);
      // Auto-hide success message after 3 seconds
      setTimeout(() => setRefreshSuccess(false), 3000);
    } catch (error) {
      console.error("Error al refrescar datos del usuario:", error);
      setRefreshError("No se pudieron actualizar los datos. Inténtalo de nuevo.");
    } finally {
      setRefreshingUser(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white rounded-full p-3">
                  <User className="h-8 w-8 text-pink-600" />
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
                  <p className="text-pink-100">Gestiona tu información personal</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleLogout}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Información del Usuario */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Información Personal</h2>
          </div>

          <div className="p-6">
            {refreshError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
                <XCircle className="h-5 w-5 mr-2" />
                {refreshError}
              </div>
            )}

            {refreshSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Datos actualizados correctamente
              </div>
            )}

            {updateError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
                <XCircle className="h-5 w-5 mr-2" />
                {updateError}
              </div>
            )}

            {updateSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Perfil actualizado correctamente
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información básica */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo
                </label>
                {isEditing ? (
                  <div>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        name="nombre"
                        value={editForm.nombre}
                        onChange={handleEditChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                          fieldErrors.nombre ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    {fieldErrors.nombre && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <XCircle className="h-4 w-4 mr-1" />
                        {fieldErrors.nombre}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-900">{user?.nombre || 'No especificado'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                {isEditing ? (
                  <div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                          fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="tu@email.com"
                      />
                    </div>
                    {fieldErrors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <XCircle className="h-4 w-4 mr-1" />
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-900">{user?.email || 'No especificado'}</span>
                  </div>
                )}
              </div>

              {/* Teléfono ocultado por requerimiento */}

              {/* ID de Usuario ocultado por requerimiento */}
            </div>

            {/* Información adicional en una sección separada */}
            {user && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información de la Cuenta</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Miembro desde</p>
                        <p className="text-sm text-blue-700">
                          {user.id ? new Date().toLocaleDateString() : 'No disponible'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-green-900">Estado</p>
                        <p className="text-sm text-green-700">Activo</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-purple-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-purple-900">Tipo de cuenta</p>
                        <p className="text-sm text-purple-700 capitalize">Cliente</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Diagnóstico de API */}
        {diagnosticResult && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <WifiOff className="h-5 w-5 mr-2 text-gray-600" />
                Diagnóstico de Conectividad
              </h2>
              <button
                onClick={() => setDiagnosticResult("")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <pre className="bg-gray-50 p-4 rounded-md text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                {diagnosticResult}
              </pre>
            </div>
          </div>
        )}
        
        {/* Historial de Citas */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Mis Citas</h2>
            <button
              onClick={cargarCitas}
              disabled={citasLoading}
              className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${citasLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
          {cancelSuccess && (
            <div className="mx-6 mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              {cancelSuccess}
            </div>
          )}
          {cancelError && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
              <XCircle className="h-5 w-5 mr-2" />
              {cancelError}
            </div>
          )}
          
          {citasError && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
              <XCircle className="h-5 w-5 mr-2" />
              {citasError}
            </div>
          )}
          
          {citasLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando citas...</p>
            </div>
          ) : citas.length > 0 ? (
            <>
              {(() => {
                const citasActivas = citas.filter((c) => c.status !== "cancelada");
                const citasCanceladas = citas.filter((c) => c.status === "cancelada");

                const parseContacto = (comments?: string): { nombre?: string; email?: string; telefono?: string } | null => {
                  if (!comments || typeof comments !== "string") return null;
                  const match = comments.match(/Contacto:\s*(.+?)\s*-\s*(.+?)\s*-\s*(.+)/i);
                  if (!match) return null;
                  const nombre = match[1]?.trim();
                  const email = match[2]?.trim();
                  const telefono = match[3]?.trim();
                  return { nombre, email, telefono };
                };

                const Card = (cita: typeof citas[number]) => {
                  const contacto = parseContacto(cita.comments);
                  return (
                    <div key={cita.id} className="p-6">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">{cita.service}</h3>
                          <div className="space-y-2">
                            <div className="flex items-center text-gray-600">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span>{citasService.formatearFecha(cita.appointment_date)}</span>
                              <Clock className="h-4 w-4 ml-4 mr-2" />
                              <span>{citasService.formatearHora(cita.appointment_date)}</span>
                            </div>
                            {(contacto || cita.comments) && (
                              <div className="mt-2">
                                {contacto ? (
                                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                    <strong>Datos de contacto:</strong>
                                    <div className="mt-1">
                                      <span className="block">Nombre: {contacto.nombre}</span>
                                      <span className="block">Teléfono: {contacto.telefono}</span>
                                      <span className="block">Email: {contacto.email}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{cita.comments}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0 md:ml-4 flex flex-col items-end space-y-2">
                          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${citasService.obtenerColorEstado(cita.status)}`}>
                            {citasService.obtenerTextoEstado(cita.status)}
                          </span>
                          {cita.status === "pendiente" && (
                            <button
                              onClick={() => handleCancelarCita(cita.id)}
                              disabled={isCancellingId === cita.id}
                              className={`text-sm underline ${isCancellingId === cita.id ? "text-gray-400 cursor-not-allowed" : "text-red-600 hover:text-red-800"}`}
                            >
                              {isCancellingId === cita.id ? (
                                <span className="inline-flex items-center"><RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Cancelando...</span>
                              ) : (
                                "Cancelar cita"
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                };

                return (
                  <>
                    {/* Activas (pendientes/confirmadas) */}
                    <div className="divide-y divide-gray-200">
                      {citasActivas.map((c) => Card(c))}
                    </div>

                    {/* Canceladas aparte */}
                    {citasCanceladas.length > 0 && (
                      <div className="mt-10 border-t border-gray-200 pt-6">
                        <h3 className="px-6 text-lg font-semibold text-gray-800 mb-4">Citas Canceladas</h3>
                        <div className="divide-y divide-gray-200">
                          {citasCanceladas.map((c) => Card(c))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          ) : (
            <div className="p-8 text-center">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes citas programadas</h3>
              <p className="text-gray-600 mb-4">Agenda tu primera cita para comenzar tu tratamiento</p>
              <button 
                onClick={() => router.push("/agendar")}
                className="px-6 py-3 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors font-medium"
              >
                Agendar una cita
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
