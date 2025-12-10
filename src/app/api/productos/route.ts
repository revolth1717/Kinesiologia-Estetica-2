import { NextRequest, NextResponse } from 'next/server';

const CONTENT_API_URL = process.env.NEXT_PUBLIC_XANO_CONTENT_API || "https://x1xv-egpg-1mua.b2.xano.io/api:SzJNIj2V";
const PRODUCTS_PATH = process.env.NEXT_PUBLIC_PRODUCTS_PATH || "/product";

interface Product {
  id: number;
  nombre: string;
  descripcion?: string;
  precio?: number;
  imagen_url?: string | { url: string };
  [key: string]: unknown;
}

interface CachedData {
  items: Product[];
  timestamp: number;
}

// Use a more specific type for the global cache if possible, but for now we'll cast safely
const GLOBAL_CACHE_KEY = '__PRODUCTS_CACHE_DATA';

export async function GET(_req: NextRequest) {
  try {
    const now = Date.now();
    const ttlMs = 15000;

    const globalCache = (global as unknown as Record<string, CachedData | undefined>);
    const cached = globalCache[GLOBAL_CACHE_KEY];

    if (cached && now - cached.timestamp < ttlMs) {
      return NextResponse.json({ success: true, data: cached.items, count: cached.items.length }, { status: 200 });
    }

    const candidates = [
      `${CONTENT_API_URL}${PRODUCTS_PATH}`,
      `${CONTENT_API_URL}/product`,
      `${CONTENT_API_URL}/products`,
      `${CONTENT_API_URL}/productos`,
      `${CONTENT_API_URL}/product/list`,
      `${CONTENT_API_URL}/productos/list`,
    ];

    let last: { status: number; data: unknown; target: string } | null = null;

    for (const target of candidates) {
      try {
        let res = await fetch(target, { method: 'GET', headers: { Accept: 'application/json, text/plain, */*' } });

        if (res.status === 429) {
          const ra = res.headers.get('retry-after');
          const wait = ra && /^\d+$/.test(ra) ? parseInt(ra, 10) * 1000 : 2200;
          await new Promise(r => setTimeout(r, wait));
          res = await fetch(target, { method: 'GET', headers: { Accept: 'application/json, text/plain, */*' } });
        }

        const text = await res.text();
        let data: unknown = null;
        try { data = JSON.parse(text); } catch { data = { raw: text }; }

        if (res.ok) {
          let items: Product[] = [];
          const responseData = data as { items?: Product[]; data?: Product[] | Product };

          if (Array.isArray(responseData?.items)) {
            items = responseData.items;
          } else if (Array.isArray(data)) {
            items = data as Product[];
          } else if (responseData?.data) {
            items = Array.isArray(responseData.data) ? responseData.data : [responseData.data];
          } else {
            items = [data as Product];
          }

          // Update cache
          globalCache[GLOBAL_CACHE_KEY] = { items, timestamp: Date.now() };

          return NextResponse.json({ success: true, data: items, count: items.length }, { status: 200 });
        }

        last = { status: res.status, data, target };

        if (res.status !== 404) {
          return NextResponse.json({ success: false, error: 'Upstream error', data }, { status: res.status });
        }
      } catch (err: unknown) {
        last = { status: 500, data: { message: String(err) }, target };
      }
    }

    const fallback = last ?? { status: 404, data: { message: 'Not Found' }, target: candidates[candidates.length - 1] };
    return NextResponse.json({ success: false, error: 'No products endpoint matched', data: fallback.data }, { status: 502 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Unexpected error', message: String(error) },
      { status: 500 }
    );
  }
}
