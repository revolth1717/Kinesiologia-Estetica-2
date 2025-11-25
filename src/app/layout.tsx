import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Script from "next/script";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${poppins.variable} font-poppins min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 dark:text-gray-100 overflow-x-auto`}
      >
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('theme');var prefers=window.matchMedia('(prefers-color-scheme: dark)').matches;var isDark=t?t==='dark':prefers;var root=document.documentElement;if(isDark){root.classList.add('dark');}else{root.classList.remove('dark');}}catch(e){}})();`}
        </Script>
        <AuthProvider>
          <CartProvider>
            <div className="lg:min-w-[1200px] flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow">{children}</main>
              <Footer />
              <Chatbot />
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
