import { NextRequest, NextResponse } from 'next/server';

const CONTENT_API_URL = process.env.NEXT_PUBLIC_CONTENT_API_URL || process.env.NEXT_PUBLIC_API_URL || process.env.XANO_GENERAL_API_URL || "https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V";
const PRODUCTS_PATH = process.env.NEXT_PUBLIC_PRODUCTS_PATH || "/product";

export async function GET(_req: NextRequest) {
  try {
    const now = Date.now();
    const ttlMs = 15000;
    if ((global as any).__PRODUCTS_CACHE && now - (global as any).__PRODUCTS_CACHE_AT < ttlMs) {
      const cached = (global as any).__PRODUCTS_CACHE;
      return NextResponse.json({ success: true, data: cached, count: Array.isArray(cached) ? cached.length : 0 }, { status: 200 });
    }
    const candidates = [
      `${CONTENT_API_URL}${PRODUCTS_PATH}`,
      `${CONTENT_API_URL}/product`,
      `${CONTENT_API_URL}/products`,
      `${CONTENT_API_URL}/productos`,
      `${CONTENT_API_URL}/product/list`,
      `${CONTENT_API_URL}/productos/list`,
    ];

    let last: { status: number; data: any; target: string } | null = null;
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
        let data: any = null;
        try { data = JSON.parse(text); } catch { data = { raw: text }; }
        if (res.ok) {
          const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : data?.data ?? data;
          (global as any).__PRODUCTS_CACHE = items;
          (global as any).__PRODUCTS_CACHE_AT = Date.now();
          return NextResponse.json({ success: true, data: items, count: Array.isArray(items) ? items.length : 0 }, { status: 200 });
        }
        last = { status: res.status, data, target };
        if (res.status !== 404) {
          return NextResponse.json({ success: false, error: 'Upstream error', data }, { status: res.status });
        }
      } catch (err: any) {
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