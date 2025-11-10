import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

// Directorio base seguro dentro de `public`
const BASE_DIR = path.join(process.cwd(), "public", "images", "tratamientos");

// Lista blanca opcional para mayor seguridad
const ALLOWED: Set<string> = new Set([
  // SVG fallbacks
  "laserlipolisis.svg",
  "cavitacion.svg",
  "facialconradiofrecuencia.svg",
  "depilacionlaser.svg",
  // Si en algún momento se agregan JPG, también permitimos
  "laserlipolisis.jpg",
  "cavitacion.jpg",
  "facialconradiofrecuencia.jpg",
  "depilacionlaser.jpg",
]);

export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const file = url.searchParams.get("file");
    if (!file) return NextResponse.json({ message: "Missing file" }, { status: 400 });

    if (!ALLOWED.has(file)) {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    const filePath = path.join(BASE_DIR, file);
    const data = await fs.readFile(filePath);
    const ext = path.extname(file).toLowerCase();
    const mime = ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : ext === ".svg"
        ? "image/svg+xml"
        : "application/octet-stream";
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    const msg = typeof err?.message === "string" ? err.message : String(err);
    return NextResponse.json({ message: "Unexpected error", detail: msg }, { status: 500 });
  }
}