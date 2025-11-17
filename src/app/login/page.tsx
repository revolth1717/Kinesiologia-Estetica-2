"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  // Validaciones en tiempo real
  const validateField = (name: string, value: string) => {
    const errors: {[key: string]: string} = {};
    
    switch (name) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          errors.email = "Ingresa un email válido";
        }
        break;
      case 'password':
        if (value && value.length < 6) {
          errors.password = "La contraseña debe tener al menos 6 caracteres";
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
    
    // Limpiar error general cuando el usuario empiece a escribir
    if (error) {
      setError("");
    }
  };

  const isFormValid = () => {
    return (
      formData.email &&
      formData.password &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
      formData.password.length >= 6 &&
      Object.values(fieldErrors).every(error => !error)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validación final
    if (!isFormValid()) {
      setError("Por favor, verifica que todos los campos sean válidos");
      return;
    }
    
    const result = await login(formData.email, formData.password);

    if (result.success) {
      try {
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        const meData = await meRes.json().catch(() => ({}));
        const roleRaw = meData?.role ?? meData?.user?.role ?? meData?.profile?.role ?? meData?.roles ?? meData?.user?.roles ?? meData?.is_admin;
        const roleStr = (() => {
          if (typeof roleRaw === "string") return roleRaw.toLowerCase();
          if (typeof roleRaw === "boolean") return roleRaw ? "administrador" : "cliente";
          if (Array.isArray(roleRaw)) {
            const hasAdmin = roleRaw.some((x: any) => typeof x === "string" && x.toLowerCase().includes("admin"));
            return hasAdmin ? "administrador" : "cliente";
          }
          return "";
        })();
        const isAdmin = roleStr.includes("admin") || roleStr === "administrador";
        router.push(isAdmin ? "/admin" : "/");
      } catch {
        router.push("/");
      }
    } else {
      setError(result.error || "Credenciales incorrectas. Por favor, intenta nuevamente.");
    }
  };

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Iniciar Sesión</h1>
          <p className="text-gray-600 dark:text-gray-300">Bienvenido de vuelta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-gray-800 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Email
            </label>
            <div>
              <div className="flex items-stretch">
                <span className={`inline-flex items-center px-3 h-12 border border-r-0 rounded-l-md bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 ${fieldErrors.email ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'}`}>
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-5 pr-4 h-12 border rounded-r-md rounded-l-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors ${
                    fieldErrors.email ? 'border-red-300 bg-red-50 dark:bg-gray-800 dark:border-red-700 dark:text-gray-100' : 'border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100'
                  }`}
                  placeholder="tu@email.com"
                  required
                  autoComplete="email"
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
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Contraseña
            </label>
            <div>
              <div className="flex items-stretch">
                <span className={`inline-flex items-center px-3 h-12 border border-r-0 rounded-l-md bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 ${fieldErrors.password ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'}`}>
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-5 h-12 border focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors ${
                    fieldErrors.password ? 'border-red-300 bg-red-50 dark:bg-gray-800 dark:border-red-700 dark:text-gray-100' : 'border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100'
                  }`}
                  placeholder="Tu contraseña"
                  required
                  autoComplete="current-password"
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

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 dark:border-gray-700 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                Recordarme
              </label>
            </div>

            <div className="text-sm">
              <Link href="/recuperar-password" className="text-pink-600 hover:text-pink-700 font-medium">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid()}
            className="w-full bg-pink-600 text-white py-3 px-4 rounded-md hover:bg-pink-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="text-pink-600 hover:text-pink-700 font-medium">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}