"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Lock, Mail, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function RegistroPage() {
  const router = useRouter();
  const { register, loading } = useAuth();
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

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
      case 'phone':
        const digits = String(value || '').replace(/\D/g, '');
        const validDigits = /^\d{8}$/.test(digits);
        if (!validDigits) {
          errors.phone = "Ingresa 8 dígitos del móvil";
        }
        break;
      case 'password':
        if (value.length < 6) {
          errors.password = "La contraseña debe tener al menos 6 caracteres";
        }
        if (formData.confirmPassword && value !== formData.confirmPassword) {
          errors.confirmPassword = "Las contraseñas no coinciden";
        }
        break;
      case 'confirmPassword':
        if (value !== formData.password) {
          errors.confirmPassword = "Las contraseñas no coinciden";
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validar campo en tiempo real
    validateField(name, value);
  };

  const isFormValid = () => {
    return (
      formData.nombre.length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
      /^\d{8}$/.test(String(formData.phone || '').replace(/\D/g, '')) &&
      formData.password.length >= 6 &&
      formData.password === formData.confirmPassword &&
      Object.values(fieldErrors).every(error => !error)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validación final
    if (!isFormValid()) {
      setError("Por favor, corrige los errores en el formulario");
      return;
    }
    
    const phoneDigits = String(formData.phone || '').replace(/\D/g, '');
    const phoneE164 = `+569${phoneDigits}`;
    const result = await register({
      nombre: formData.nombre,
      email: formData.email,
      phone: phoneE164,
      password: formData.password
    });
    
    if (result.success) {
      // Redirigir al usuario a la página principal
      router.push("/");
    } else {
      setError(result.error || "Error al registrar. Por favor, intenta nuevamente.");
    }
  };

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:bg-gray-900 dark:from-gray-900 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-pink-200 dark:border-pink-600/40">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Crear Cuenta</h1>
          <p className="text-gray-600 dark:text-gray-300">Únete a nuestra comunidad</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
              <XCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre completo
            </label>
            <div>
              <div className="flex items-stretch">
                <span className={`inline-flex items-center px-3 border border-r-0 rounded-l-md bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 ${fieldErrors.nombre ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'}`}>
                  <User className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className={`w-full pl-5 pr-4 h-12 border rounded-r-md rounded-l-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                    fieldErrors.nombre ? 'border-red-300 bg-red-50 dark:bg-gray-800 dark:border-red-700 dark:text-gray-100' : 'border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100'
                  }`}
                  placeholder="Tu nombre completo"
                  required
                />
              </div>
              {fieldErrors.nombre && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <XCircle className="h-4 w-4 mr-1" />
                  {fieldErrors.nombre}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <div>
              <div className="flex items-stretch">
                <span className={`inline-flex items-center px-3 border border-r-0 rounded-l-md bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 ${fieldErrors.email ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'}`}>
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-5 pr-4 h-12 border rounded-r-md rounded-l-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                    fieldErrors.email ? 'border-red-300 bg-red-50 dark:bg-gray-800 dark:border-red-700 dark:text-gray-100' : 'border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100'
                  }`}
                  placeholder="tu@email.com"
                  required
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <XCircle className="h-4 w-4 mr-1" />
                  {fieldErrors.email}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Teléfono
            </label>
            <div>
              <div className="flex items-stretch">
                <span className={`inline-flex items-center px-3 h-12 border border-r-0 rounded-l-md bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 ${fieldErrors.phone ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'}`}>+569</span>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  inputMode="numeric"
                  className={`w-full pl-5 pr-4 h-12 border rounded-r-md rounded-l-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                    fieldErrors.phone ? 'border-red-300 bg-red-50 dark:bg-gray-800 dark:border-red-700 dark:text-gray-100' : 'border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100'
                  }`}
                  placeholder="12345678"
                  required
                />
              </div>
              {fieldErrors.phone && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <XCircle className="h-4 w-4 mr-1" />
                  {fieldErrors.phone}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contraseña
            </label>
            <div>
              <div className="flex items-stretch">
                <span className={`inline-flex items-center px-3 border border-r-0 rounded-l-md bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 ${fieldErrors.password ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'}`}>
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-5 h-12 border focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                    fieldErrors.password ? 'border-red-300 bg-red-50 dark:bg-gray-800 dark:border-red-700 dark:text-gray-100' : 'border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100'
                  }`}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`inline-flex items-center px-3 h-12 border border-l-0 rounded-r-md bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 ${fieldErrors.password ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'}`}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <XCircle className="h-4 w-4 mr-1" />
                  {fieldErrors.password}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirmar contraseña
            </label>
            <div>
              <div className="flex items-stretch">
                <span className={`inline-flex items-center px-3 border border-r-0 rounded-l-md bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 ${fieldErrors.confirmPassword ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'}`}>
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-5 h-12 border focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                    fieldErrors.confirmPassword ? 'border-red-300 bg-red-50 dark:bg-gray-800 dark:border-red-700 dark:text-gray-100' : 'border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100'
                  }`}
                  placeholder="Repite tu contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`inline-flex items-center px-3 h-12 border border-l-0 rounded-r-md bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 ${fieldErrors.confirmPassword ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'}`}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <XCircle className="h-4 w-4 mr-1" />
                  {fieldErrors.confirmPassword}
                </p>
              )}
              {formData.confirmPassword && !fieldErrors.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="mt-1 text-sm text-green-600 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Las contraseñas coinciden
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid()}
            className="w-full bg-pink-600 text-white py-3 px-4 rounded-md hover:bg-pink-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-pink-600 hover:text-pink-700 font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}