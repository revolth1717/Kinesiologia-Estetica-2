"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingCart, LogIn, UserPlus, User, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') {
        setTheme(saved as 'dark' | 'light');
        return;
      }
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    } catch {}
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };
  const { isLoggedIn, user, logout } = useAuth();

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-pink-600 dark:text-pink-400">Kinesiología Estética</span>
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden lg:flex items-center space-x-3 sm:space-x-4">
            <Link href="/tratamientos" className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
              Tratamientos
            </Link>
            <Link href="/productos" className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
              Productos
            </Link>
            <Link href="/contacto" className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
              Contacto
            </Link>
            <Link href="/carrito" className="p-2 text-pink-600 dark:text-pink-400 hover:text-pink-800 dark:hover:text-pink-300 transition-colors">
              <ShoppingCart className="h-6 w-6" />
            </Link>

            <button
              onClick={toggleTheme}
              aria-label="Cambiar modo"
              className="p-2 rounded-md text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            
            {isLoggedIn ? (
              <div className="flex items-center ml-4">
                <Link href="/perfil" className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
                  <User className="h-5 w-5 mr-1" />
                  <span className="max-w-[150px] truncate" title={String(user?.nombre || user?.email)}>{user?.nombre || user?.email}</span>
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
                <Link href="/login" className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
                  <LogIn className="h-5 w-5 mr-1" />
                  <span>Iniciar sesión</span>
                </Link>
                <Link href="/registro" className="ml-2 flex items-center px-3 py-2 bg-pink-600 text-white hover:bg-pink-700 rounded-md transition-colors">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <button
              onClick={toggleTheme}
              aria-label="Cambiar modo"
              className="ml-2 inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 focus:outline-none"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/tratamientos" className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
              Tratamientos
            </Link>
            <Link href="/productos" className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
              Productos
            </Link>
            <Link href="/contacto" className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
              Contacto
            </Link>
            <Link href="/carrito" className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Carrito
            </Link>
            
            {isLoggedIn ? (
              <>
                <Link href="/perfil" className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
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
                <Link href="/login" className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
                  <LogIn className="h-5 w-5 mr-2" />
                  Iniciar sesión
                </Link>
                <Link href="/registro" className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
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