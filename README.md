This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Setup

- Install dependencies: `npm install`
 - Environment file: `.env.local` is auto-created after `npm install` from `.env.example`. Edit `.env.local` if you need to override endpoints.
- Fill required variables in `.env.local`:
  - `NEXT_PUBLIC_API_URL`  Base API URL for citas and content
  - `NEXT_PUBLIC_AUTH_URL`  Base API URL for auth endpoints
  - `NEXT_PUBLIC_CONTENT_API_URL`  Optional; defaults to `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_TREATMENTS_PATH`  Path segment for treatments (default `/tratamientos`)
  - `NEXT_PUBLIC_ZONES_SEGMENT`  Segment name for zones (default `zonas`)
  - `NEXT_PUBLIC_ZONES_BY_TREATMENT_PATH`  Path to fetch zones by treatment (default `/zonas-por-tratamiento`)
  - `NEXT_PUBLIC_USE_LOCAL_TREATMENT_IMAGES` Enable local JPG fallbacks for treatment images (default `false`)

Example:

```
NEXT_PUBLIC_API_URL=https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V
NEXT_PUBLIC_AUTH_URL=https://x8ki-letl-twmt.n7.xano.io/api:-E-1dvfg
NEXT_PUBLIC_CONTENT_API_URL=
NEXT_PUBLIC_TREATMENTS_PATH=/tratamientos
NEXT_PUBLIC_ZONES_SEGMENT=zonas
NEXT_PUBLIC_ZONES_BY_TREATMENT_PATH=/zonas-por-tratamiento
NEXT_PUBLIC_USE_LOCAL_TREATMENT_IMAGES=false
```

## Clone & Run

- Prerequisites:
  - Node.js `>=18.17.0`
  - Git installed
- Steps:
  - Clone the repository and enter the app folder:
    - `git clone <YOUR_REPO_URL>`
    - `cd kinesiologia-estetica-pro`
  - Install dependencies (auto-creates `.env.local` from `.env.example` or defaults):
    - `npm install`
  - Start the dev server:
    - `npm run dev`
  - Open `http://localhost:3000/` in your browser.
- Validate quickly:
  - Visit `/tratamientos` and `/agendar` to confirm images and data load correctly.
  - If a treatment lacks `imagen_url`, a local JPG fallback should appear via `/api/local-images`.
  - Test login/signup; verify a token is stored in `localStorage` as `authToken`.
- Notes:
  - Defaults prefer remote `imagen_url` and only fallback to local JPGs when missing.
  - No `next/image` remote domains are required; regular `<img>` is used.
  - You can edit `.env.local` if you need to point to different API endpoints.

## Environment Requirements

- Node.js 18+
  - Recommended: Node `>=18.17.0` (enforced via `package.json` engines)
- A configured Xano workspace with endpoints:
  - `GET /appointment/user` (or `GET /citas/usuario`)
  - `POST /appointment` (or `POST /citas`)
  - `PATCH /appointment/{id}` (or `PATCH /citas/{id}`)
  - `POST /auth/login`, `POST /auth/signup`, `GET /auth/me`

See `XANO-CITAS-SETUP.md` and `CONFIGURACION-API.md` for endpoint details.

## DB-only Behavior

- Appointments, authentication, treatments, and zones load strictly from backend.
- No localStorage fallbacks are used for citas or user data (only token persists).
- If API fails, UI shows error messages rather than silent fallbacks.

## Local Images Fallback

- If a treatment has no `imagen_url`, the app serves local JPGs from `public/images/tratamientos` via `GET /api/local-images?file=...`.
- Allowed files (present): `laserlipolisis.jpg`, `cavitacion.jpg`, `facialconradiofrecuencia.jpg`, `depilacionlaser.jpg`.
- Set `NEXT_PUBLIC_USE_LOCAL_TREATMENT_IMAGES=true` to prefer local images.

## Troubleshooting

- Verify `.env.local` values are correct and accessible in the browser.
- Ensure your token is stored after login in `localStorage` as `authToken`.
- Use `scripts/test-citas-endpoints.js` with a valid token to test APIs.
- Check console for diagnostics: `src/utils/apiDiagnostic.ts` logs API URL and auth state.
