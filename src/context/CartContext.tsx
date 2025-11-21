"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import type { NuevaCita } from "@/services/citasService";

type CartItemCita = {
  id: string;
  tratamiento: string;
  zona?: string;
  sesiones: 1 | 8;
  fecha: string;
  hora: string;
  precioTotal: number;
  precioAgenda: number;
  nuevaCita: NuevaCita;
};

type CartItemProducto = {
  id: string;
  tipo: "producto";
  productId?: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  imagen_url?: string;
};

export type CartItem = CartItemCita | CartItemProducto;

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  addProduct: (
    item: Omit<CartItemProducto, "id" | "tipo"> & { id?: string }
  ) => void;
  updateProductQuantity: (id: string, cantidad: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  subtotalAgenda: number;
  subtotalProductos: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "cartItems";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem(STORAGE_KEY)
          : null;
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems(prev => [item, ...prev]);
  };

  const addProduct = (
    item: Omit<CartItemProducto, "id" | "tipo"> & { id?: string }
  ) => {
    const id = item.id ?? crypto.randomUUID();
    setItems(prev => {
      const idx = prev.findIndex(
        i => "tipo" in i && i.tipo === "producto" && i.id === id
      );
      if (idx >= 0) {
        const next = [...prev];
        const existing = next[idx] as CartItemProducto;
        next[idx] = {
          ...existing,
          cantidad: existing.cantidad + item.cantidad,
        };
        return next;
      }
      return [
        {
          id,
          tipo: "producto",
          productId: item.productId,
          nombre: item.nombre,
          precioUnitario: item.precioUnitario,
          cantidad: item.cantidad,
          imagen_url: item.imagen_url,
        },
        ...prev,
      ];
    });
  };

  const updateProductQuantity = (id: string, cantidad: number) => {
    setItems(prev =>
      prev.map(i =>
        "tipo" in i && i.tipo === "producto" && i.id === id
          ? { ...i, cantidad }
          : i
      )
    );
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const clear = () => setItems([]);

  const subtotalAgenda = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + ("precioTotal" in i ? i.precioTotal : 0),
        0
      ),
    [items]
  );
  const subtotalProductos = useMemo(
    () =>
      items.reduce(
        (sum, i) =>
          sum +
          ("tipo" in i && i.tipo === "producto"
            ? i.precioUnitario * i.cantidad
            : 0),
        0
      ),
    [items]
  );

  const value: CartContextType = {
    items,
    addItem,
    addProduct,
    updateProductQuantity,
    removeItem,
    clear,
    subtotalAgenda,
    subtotalProductos,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe ser usado dentro de CartProvider");
  return ctx;
}
