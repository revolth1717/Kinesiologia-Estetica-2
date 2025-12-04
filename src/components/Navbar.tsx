"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ShoppingCart,
  LogIn,
  UserPlus,
  User,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load theme preference after mount to avoid hydration mismatch
    try {
      const cookie = document.cookie;
      const match = cookie.match(/(?:^|; )theme=(dark|light)/);
      const fromCookie = match ? (match[1] as "dark" | "light") : null;
      if (fromCookie) {
        setTheme(fromCookie);
        return;
      }
      const saved = localStorage.getItem("theme");
      if (saved === "dark" || saved === "light") {
        setTheme(saved as "dark" | "light");
        return;
      }
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    } catch {
      setTheme("light");
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
    try {
      const maxAge = 60 * 60 * 24 * 365;
      document.cookie = `theme=${theme}; Path=/; Max-Age=${maxAge}`;
    } catch { }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };
  const { isLoggedIn, user, logout, loading } = useAuth();
  const { items } = useCart();

  const cartCount = items.reduce((acc, item) => {
    if ("tipo" in item && item.tipo === "producto") {
      return acc + item.cantidad;
    }
    return acc + 1; // Tratamientos cuentan como 1
  }, 0);

  const pathname = usePathname();
  const isAdminPage = (pathname || "").startsWith("/admin");
  const isAdmin = (() => {
    const r = (user as any)?.role;
    if (!r) return false;
    const s = typeof r === "string" ? r.toLowerCase() : String(r).toLowerCase();
    return s.includes("admin") || s === "administrador";
  })();
  const isAdminProfile = isLoggedIn && isAdmin && (pathname || "") === "/perfil";

  // Don't render dynamic content until mounted to avoid hydration errors
  if (!mounted) {
    return (
      <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                  Kinesiología Estética
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={isLoggedIn && isAdmin ? "/admin" : "/"} className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                Kinesiología Estética
              </span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden lg:flex items-center space-x-3 sm:space-x-4">
            {!(isLoggedIn && isAdmin) && (
              <>
                <Link
                  href="/tratamientos"
                  className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Tratamientos
                </Link>
                <Link
                  href="/productos"
                  className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Productos
                </Link>
                <Link
                  href="/contacto"
                  className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Contacto
                </Link>
              </>
            )}
            {isLoggedIn && isAdmin && !isAdminPage && !isAdminProfile && (
              <>
                <Link
                  href="/admin/citas"
                  className="px-3 py-2 text-pink-700 dark:text-pink-300 hover:text-pink-900 dark:hover:text-pink-200 transition-colors border rounded-md border-pink-300"
                >
                  Gestión de citas
                </Link>
                <Link
                  href="/admin/pedidos"
                  className="px-3 py-2 text-pink-700 dark:text-pink-300 hover:text-pink-900 dark:hover:text-pink-200 transition-colors border rounded-md border-pink-300"
                >
                  Productos comprados
                </Link>
                <Link
                  href="/admin/inventario"
                  className="px-3 py-2 text-pink-700 dark:text-pink-300 hover:text-pink-900 dark:hover:text-pink-200 transition-colors border rounded-md border-pink-300"
                >
                  Gestión de inventario
                </Link>
                <Link
                  href="/admin/usuarios"
                  className="px-3 py-2 text-pink-700 dark:text-pink-300 hover:text-pink-900 dark:hover:text-pink-200 transition-colors border rounded-md border-pink-300"
                >
                  Buscador de usuarios
                </Link>
              </>
            )}
            {!(isLoggedIn && isAdmin) && (
              <Link
                href="/carrito"
                className="p-2 text-pink-600 dark:text-pink-400 hover:text-pink-800 dark:hover:text-pink-300 transition-colors relative"
              >
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            <button
              onClick={toggleTheme}
              aria-label="Cambiar modo"
              className="p-2 rounded-md text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
            >
              {!mounted ? (
                <Moon className="h-5 w-5" />
              ) : theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {loading ? (
              <div className="flex items-center ml-4">
                <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ) : isLoggedIn ? (
              <div className="flex items-center ml-4">
                <Link
                  href="/perfil"
                  className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  <User className="h-5 w-5 mr-1" />
                  <span
                    className="max-w-[150px] truncate"
                    title={String(user?.nombre || user?.email)}
                  >
                    {user?.nombre || user?.email}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="ml-2 flex items-center px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  <span>Salir</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center ml-4">
                <Link
                  href="/login"
                  className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  <LogIn className="h-5 w-5 mr-1" />
                  <span>Iniciar sesión</span>
                </Link>
                <Link
                  href="/registro"
                  className="ml-2 flex items-center px-3 py-2 bg-pink-600 text-white hover:bg-pink-700 rounded-md transition-colors"
                >
                  <UserPlus className="h-5 w-5 mr-1" />
                  <span>Registrarse</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
            <button
              onClick={toggleTheme}
              aria-label="Cambiar modo"
              className="ml-2 inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 focus:outline-none"
            >
              {!mounted ? (
                <Moon className="h-5 w-5" />
              ) : theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {!(isLoggedIn && isAdmin) && (
              <>
                <Link
                  href="/tratamientos"
                  className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Tratamientos
                </Link>
                <Link
                  href="/productos"
                  className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Productos
                </Link>
                <Link
                  href="/contacto"
                  className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Contacto
                </Link>
              </>
            )}
            {isLoggedIn && isAdmin && !isAdminPage && !isAdminProfile && (
              <>
                <Link
                  href="/admin/citas"
                  className="block px-3 py-2 text-pink-700 dark:text-pink-300 hover:text-pink-900 dark:hover:text-pink-200 transition-colors border rounded-md border-pink-300"
                >
                  Gestión de citas
                </Link>
                <Link
                  href="/admin/pedidos"
                  className="block px-3 py-2 text-pink-700 dark:text-pink-300 hover:text-pink-900 dark:hover:text-pink-200 transition-colors border rounded-md border-pink-300"
                >
                  Productos comprados
                </Link>
                <Link
                  href="/admin/inventario"
                  className="block px-3 py-2 text-pink-700 dark:text-pink-300 hover:text-pink-900 dark:hover:text-pink-200 transition-colors border rounded-md border-pink-300"
                >
                  Gestión de inventario
                </Link>
                <Link
                  href="/admin/usuarios"
                  className="block px-3 py-2 text-pink-700 dark:text-pink-300 hover:text-pink-900 dark:hover:text-pink-200 transition-colors border rounded-md border-pink-300"
                >
                  Buscador de usuarios
                </Link>
              </>
            )}
            {!(isLoggedIn && isAdmin) && (
              <Link
                href="/carrito"
                className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
              >
                <div className="relative mr-2">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {cartCount}
                    </span>
                  )}
                </div>
                Carrito
              </Link>
            )}

            {loading ? (
              <div className="px-3 py-2">
                <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ) : isLoggedIn ? (
              <>
                <Link
                  href="/perfil"
                  className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  <User className="h-5 w-5 mr-2" />
                  Mi Perfil
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center w-full text-left px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;