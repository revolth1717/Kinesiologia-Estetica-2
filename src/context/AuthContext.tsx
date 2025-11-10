"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type User = {
  id?: string | number;
  email: string;
  nombre?: string;
  telefono?: string;
};

type AuthContextType = {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<{success: boolean, error?: string}>;
  register: (userData: { email: string; nombre: string; telefono?: string; password: string }) => Promise<{success: boolean, error?: string}>;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V";
// Usar rutas locales que proxian a Xano y gestionan cookies HttpOnly
const AUTH_LOCAL = "/api/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  // No usamos localStorage para el token; dependemos de cookie HttpOnly

  const fetchMe = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${AUTH_LOCAL}/me`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "No autorizado");
      }

      const userData = {
        id: data.id,
        email: data.email,
        nombre: data.name ?? data.nombre,
        telefono: data.phone ?? data.telefono ?? "",
      } as User;

      setUser(userData);
      setIsLoggedIn(true);
    } catch (err) {
      console.warn(" No se pudo validar sesión con el backend:", err);
      setUser(null);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Validar sesión únicamente contra el backend con cookies
    fetchMe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${AUTH_LOCAL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        setLoading(false);
        return { success: false, error: data.message || 'Error al iniciar sesión' };
      }

      // Obtener los datos reales del usuario desde el backend usando cookie
      await fetchMe();
      return { success: true };
    } catch (error) {
      console.error("Error de inicio de sesión:", error);
      setLoading(false);
      return { success: false, error: 'No se pudo conectar. Intenta nuevamente.' };
    }
  };

  const register = async (userData: { email: string; nombre: string; telefono?: string; password: string }) => {
    setLoading(true);
    try {
      const response = await fetch(`${AUTH_LOCAL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          name: userData.nombre,
          phone: userData.telefono || '',
          telefono: userData.telefono || ''
        }),
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        setLoading(false);
        return { success: false, error: data.message || 'Error al registrar usuario' };
      }

      // Tras registrar, obtener datos frescos del usuario con cookie
      await fetchMe();
      return { success: true };
    } catch (error) {
      console.error("Error de registro:", error);
      setLoading(false);
      return { success: false, error: 'No se pudo conectar. Intenta nuevamente.' };
    }
  };

  const logout = () => {
    // Intentar logout de backend si existe
    fetch(`${AUTH_LOCAL}/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    setUser(null);
    setIsLoggedIn(false);
  };

  const refreshUser = async () => {
    await fetchMe();
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, register, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}
