'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen_url?: string;
  categoria?: string;
  imagen_alternativas?: string[];
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addProduct } = useCart();
  const [cantidades, setCantidades] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      // Usar el endpoint local que se conecta a Xano
      const response = await fetch('/api/productos');
      
      if (!response.ok) {
        throw new Error('Error al cargar productos');
      }
      
      const data = await response.json();
      const get = (obj: Record<string, unknown>, keys: string[]) => {
        for (const k of keys) {
          if (obj[k] !== undefined) return obj[k];
        }
        return undefined;
      };

      const toStr = (v: unknown, def = '') => {
        if (typeof v === 'string') return v;
        if (typeof v === 'number') return String(v);
        if (v == null) return def;
        return String(v);
      };

      const toNum = (v: unknown, def = 0) => {
        if (typeof v === 'number' && !Number.isNaN(v)) return v;
        if (typeof v === 'string') {
          const n = Number(v);
          return Number.isNaN(n) ? def : n;
        }
        return def;
      };

      const normalize = (item: Record<string, unknown>): Producto => {
        const imgCandidate = get(item, ['imagen_url', 'image_url', 'imagen', 'image']);
        let imageUrl = '';
        if (typeof imgCandidate === 'string') imageUrl = imgCandidate as string;
        else if (imgCandidate && typeof imgCandidate === 'object') {
          const obj = imgCandidate as Record<string, unknown>;
          const urlField = obj['url'] ?? obj['download_url'] ?? obj['full_url'] ?? obj['href'];
          if (typeof urlField === 'string') imageUrl = urlField as string;
        }
        const localFile = toStr(get(item, ['imagen_local', 'image_local', 'filename', 'file', 'image_file', 'imagen_file']), '');
        const baseDir = process.env.NEXT_PUBLIC_PRODUCT_IMAGES_DIR ?? '/productos';
        const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const nameRaw = toStr(get(item, ['nombre', 'name', 'titulo', 'title']), 'producto');
        const nameLower = nameRaw.toLowerCase().trim();
        const nameSlug = slugify(nameRaw);
        const nameDash = nameLower.replace(/\s+/g, '-');
        const nameUnderscore = nameLower.replace(/\s+/g, '_');
        const nameNoSpaces = nameLower.replace(/\s+/g, '');
        const baseNames = [nameSlug, nameDash, nameUnderscore, nameNoSpaces, nameRaw.trim()];
        const candidates: string[] = [];
        const allowRemote = process.env.NEXT_PUBLIC_ALLOW_REMOTE_IMAGE_FALLBACK !== 'false';
        if (allowRemote && imageUrl) candidates.push(imageUrl);
        if (localFile) candidates.push(`${baseDir}/${localFile}`);
        ['jpg','jpeg','png','webp'].forEach(ext => {
          baseNames.forEach(n => candidates.push(`${baseDir}/${n}.${ext}`));
        });
        const finalUrl = candidates[0] || imageUrl || undefined;

        return {
          id: toStr(get(item, ['id', 'ID', 'uuid']), crypto.randomUUID()),
          nombre: toStr(get(item, ['nombre', 'name', 'titulo']), 'Producto'),
          descripcion: toStr(get(item, ['descripcion', 'description', 'detalle']), ''),
          precio: toNum(get(item, ['precio', 'price', 'valor']), 0),
          stock: toNum(get(item, ['stock', 'existencias', 'quantity', 'cantidad']), 0),
          imagen_url: finalUrl || undefined,
          imagen_alternativas: candidates.slice(1),
          categoria: toStr(get(item, ['categoria', 'category']), '' ) || undefined,
        };
      };

      if (data.success) {
        const list = Array.isArray(data.data) ? data.data : [];
        const mapped = list.map(normalize).filter(p => !!p && !!p.nombre && p.nombre.trim().length > 0);
        const uniq: Producto[] = [];
        const seen = new Set<string>();
        for (const p of mapped) {
          const key = (p.id || `${p.nombre}-${p.categoria || ''}`).toString();
          if (seen.has(key)) continue;
          seen.add(key);
          uniq.push(p);
        }
        uniq.sort((a, b) => {
          const ca = a.categoria || '';
          const cb = b.categoria || '';
          const byCat = ca.localeCompare(cb, 'es');
          return byCat !== 0 ? byCat : a.nombre.localeCompare(b.nombre, 'es');
        });
        setProductos(uniq);
      } else {
        throw new Error(data.error || 'Error al cargar productos');
      }
    } catch (err) {
      setError('Error al cargar los productos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (producto: Producto) => {
    const qty = cantidades[producto.id] ?? 1;
    if (qty < 1) return;
    addProduct({ nombre: producto.nombre, precioUnitario: producto.precio, cantidad: qty, imagen_url: producto.imagen_url });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-pink-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Nuestros Productos</h1>
            <p className="text-xl text-pink-100">
              Descubre nuestra línea de productos profesionales para el cuidado de tu piel
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {productos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No hay productos disponibles en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productos.map((producto) => (
              <div key={producto.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Product Image */}
                <div className="h-60 md:h-72 bg-white flex items-center justify-center">
                  {producto.imagen_url ? (
                    <img
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      className="max-h-full max-w-full object-contain p-2"
                      data-alts={(producto.imagen_alternativas || []).join(',')}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const alts = (target.getAttribute('data-alts') || '').split(',').filter(Boolean);
                        if (alts.length > 0) {
                          const next = alts[0];
                          const rest = alts.slice(1).join(',');
                          target.setAttribute('data-alts', rest);
                          target.src = next;
                        } else {
                          target.src = 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Producto%20de%20cosm%C3%A9tica%20profesional%20en%20una%20presentaci%C3%B3n%20elegante%2C%20fondo%20blanco%2C%20estilo%20minimalista&image_size=square';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center">
                      <span className="text-pink-600 text-4xl font-bold">{producto.nombre.charAt(0)}</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{producto.nombre}</h3>
                    {producto.categoria && (
                      <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded-full">
                        {producto.categoria}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {producto.descripcion}
                  </p>

                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="text-2xl font-bold text-pink-600">
                        ${producto.precio.toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${
                        producto.stock > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {producto.stock > 0 ? `${producto.stock} disponibles` : 'Sin stock'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center border rounded-md">
                      <button
                        onClick={() => setCantidades(prev => ({ ...prev, [producto.id]: Math.max(1, (prev[producto.id] ?? 1) - 1) }))}
                        className="px-3 py-2 text-gray-700 hover:text-pink-600"
                        aria-label="Disminuir"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={producto.stock || undefined}
                        value={cantidades[producto.id] ?? 1}
                        onChange={(e) => {
                          const v = Math.max(1, Math.min(Number(e.target.value || 1), producto.stock || Infinity));
                          setCantidades(prev => ({ ...prev, [producto.id]: v }));
                        }}
                        className="w-16 text-center border-l border-r py-2"
                      />
                      <button
                        onClick={() => setCantidades(prev => ({ ...prev, [producto.id]: Math.min((producto.stock || Infinity), (prev[producto.id] ?? 1) + 1) }))}
                        className="px-3 py-2 text-gray-700 hover:text-pink-600"
                        aria-label="Aumentar"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-sm text-gray-600">
                      Total: ${(producto.precio * (cantidades[producto.id] ?? 1)).toLocaleString('es-CL')}
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(producto)}
                    disabled={producto.stock === 0}
                    className={`w-full flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                      producto.stock > 0
                        ? 'bg-pink-600 text-white hover:bg-pink-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {producto.stock > 0 ? 'Agregar al carrito' : 'Sin stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}