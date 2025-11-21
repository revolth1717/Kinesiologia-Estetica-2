import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Script from "next/script";
import { cookies } from "next/headers";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Kinesiología Estética - Servicios de Estética y Bienestar",
  description:
    "Servicios profesionales de kinesiología estética para todos los tipos de clientes. Agenda tu cita y mejora tu bienestar.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initialUser: any = null;
  let initialIsLoggedIn = false;
  let initialThemeIsDark = false;
  try {
    const cookieStore = await cookies();
    const themeCookie = cookieStore.get("theme");
    initialThemeIsDark = themeCookie?.value === "dark";
    const cookieHeader = cookieStore
      .getAll()
      .map(c => `${c.name}=${c.value}`)
      .join("; ");
    const res = await fetch(`/api/auth/me`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const emailRaw = data?.email ?? data?.user?.email ?? data?.profile?.email;
      const nombreRaw =
        data?.name ??
        data?.nombre ??
        data?.user?.name ??
        data?.user?.nombre ??
        data?.profile?.name ??
        data?.profile?.nombre;
      const phoneRaw =
        data?.phone ??
        data?.user?.phone ??
        data?.profile?.phone ??
        data?.phone_number ??
        data?.user?.phone_number;
      const roleRaw =
        data?.role ??
        data?.user?.role ??
        data?.profile?.role ??
        data?.roles ??
        data?.user?.roles ??
        data?.is_admin;
      const roleNorm = (() => {
        const r = roleRaw as any;
        if (typeof r === "string") {
          const s = r.toLowerCase();
          if (s.includes("admin")) return "administrador";
          return "cliente";
        }
        if (typeof r === "boolean") {
          return r ? "administrador" : "cliente";
        }
        if (Array.isArray(r)) {
          const hasAdmin = r.some(
            (x: any) => typeof x === "string" && x.toLowerCase().includes("admin")
          );
          return hasAdmin ? "administrador" : "cliente";
        }
        return undefined;
      })();
      initialUser = {
        id: data?.id ?? data?.user?.id ?? undefined,
        email: typeof emailRaw === "string" ? emailRaw : String(emailRaw ?? ""),
        nombre:
          typeof nombreRaw === "string"
            ? nombreRaw
            : nombreRaw
            ? String(nombreRaw)
            : undefined,
        phone: typeof phoneRaw === "string" ? phoneRaw : String(phoneRaw ?? ""),
        role: roleNorm,
      };
      initialIsLoggedIn = true;
    }
  } catch {}
  return (
    <html lang="es" suppressHydrationWarning className={initialThemeIsDark ? "dark" : ""}>
      <body
        className={`${poppins.variable} font-poppins min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 dark:text-gray-100 overflow-x-auto`}
      >
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var cookies=document.cookie||'';var m=cookies.match(/(?:^|; )theme=(dark|light)/);var fromCookie=m?m[1]:null;var t=localStorage.getItem('theme');var prefers=window.matchMedia('(prefers-color-scheme: dark)').matches;var isDark=fromCookie?fromCookie==='dark':(t?t==='dark':prefers);var root=document.documentElement;if(isDark){root.classList.add('dark');}else{root.classList.remove('dark');}}catch(e){}})();`}
        </Script>
        <AuthProvider initialUser={initialUser} initialIsLoggedIn={initialIsLoggedIn}>
          <CartProvider>
            <div className="lg:min-w-[1200px] flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
