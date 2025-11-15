"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
  adminOnly?: boolean;
}

export default function ProtectedRoute({
  children,
  redirectTo = "/login",
  requireAuth = true,
  adminOnly = false,
}: ProtectedRouteProps) {
  const { user, isLoggedIn, loading } = useAuth();
  const router = useRouter();
  const isAdmin = (() => {
    const r = (user as any)?.role;
    if (!r) return false;
    const s = typeof r === "string" ? r.toLowerCase() : String(r).toLowerCase();
    return s.includes("admin") || s === "administrador";
  })();

  useEffect(() => {
    if (loading) return; // Esperar a que termine de cargar

    // Si requiere autenticación y no está logueado
    if (requireAuth && !isLoggedIn) {
      router.push(redirectTo);
      return;
    }

    // Si requiere ser admin y no lo es
    if (adminOnly && (!user || !isAdmin)) {
      router.push("/"); // Redirigir al home si no es admin
      return;
    }

    // Si no requiere autenticación pero está logueado (ej: login/registro)
    if (!requireAuth && isLoggedIn) {
      router.push("/perfil"); // Redirigir al perfil si ya está logueado
      return;
    }
  }, [user, isLoggedIn, loading, router, redirectTo, requireAuth, adminOnly]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si requiere autenticación y no está logueado, no mostrar nada (se redirige)
  if (requireAuth && !isLoggedIn) {
    return null;
  }

  // Si requiere ser admin y no lo es, no mostrar nada (se redirige)
  if (adminOnly && (!user || !isAdmin)) {
    return null;
  }

  // Si no requiere autenticación pero está logueado, no mostrar nada (se redirige)
  if (!requireAuth && isLoggedIn) {
    return null;
  }

  // Mostrar el contenido protegido
  return <>{children}</>;
}
