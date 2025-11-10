"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { NuevaCita } from "@/services/citasService";

export type CartItem = {
  id: string; // unique id
  tratamiento: string;
  zona?: string;
  sesiones: 1 | 8;
  fecha: string; // ISO date (YYYY-MM-DD)
  hora: string; // HH:mm
  precioTotal: number; // full price
  precioAgenda: number; // 50% deposit
  nuevaCita: NuevaCita; // payload to create appointment after payment
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  subtotalAgenda: number; // sum of agenda price (deposit)
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "cartItems";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems(prev => [item, ...prev]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const clear = () => setItems([]);

  const subtotalAgenda = useMemo(() => items.reduce((sum, i) => sum + (i.precioAgenda || 0), 0), [items]);

  const value: CartContextType = { items, addItem, removeItem, clear, subtotalAgenda };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe ser usado dentro de CartProvider");
  return ctx;
}