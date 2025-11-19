"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Package, ClipboardList } from "lucide-react";

const AdminNav = () => {
  const pathname = usePathname();
  const mkBtn = (
    href: string,
    label: string,
    Icon: any
  ) => {
    const active = pathname === href;
    const base = active
      ? "bg-pink-600 text-white border-pink-600"
      : "bg-gray-100 text-gray-800 border-gray-300 hover:border-pink-300";
    return (
      <Link
        href={href}
        className={`inline-flex items-center justify-center w-full px-3 py-2 rounded-md border ${base}`}
      >
        <Icon className="h-5 w-5 mr-2" />
        {label}
      </Link>
    );
  };

  return (
    <div className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 py-3">
          {mkBtn("/admin/citas", "Gestión de citas", Calendar)}
          {mkBtn("/admin/pedidos", "Productos comprados", Package)}
          {mkBtn("/admin/inventario", "Gestión de inventario", Package)}
          {mkBtn("/admin/usuarios", "Buscador de usuarios", ClipboardList)}
        </div>
      </div>
    </div>
  );
};

export default AdminNav;