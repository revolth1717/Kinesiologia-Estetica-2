const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const envLocalPath = path.join(cwd, '.env.local');
const envExamplePath = path.join(cwd, '.env.example');

function writeDefaults(filePath) {
  const defaults = `# Next.js app environment\n
NEXT_PUBLIC_API_URL=https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V\n
NEXT_PUBLIC_AUTH_URL=https://x8ki-letl-twmt.n7.xano.io/api:-E-1dvfg\n
NEXT_PUBLIC_CONTENT_API_URL=\n
NEXT_PUBLIC_TREATMENTS_PATH=/tratamientos\n
NEXT_PUBLIC_ZONES_SEGMENT=zonas\n
NEXT_PUBLIC_ZONES_BY_TREATMENT_PATH=/zonas-por-tratamiento\n
NEXT_PUBLIC_USE_LOCAL_TREATMENT_IMAGES=false\n

# Xano endpoints (optional overrides)\n
XANO_API_URL=https://x8ki-letl-twmt.n7.xano.io/api:-E-1dvfg\n
XANO_GENERAL_API_URL=https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V\n
XANO_AUTH_API_URL=https://x8ki-letl-twmt.n7.xano.io/api:-E-1dvfg\n`;
  fs.writeFileSync(filePath, defaults, { encoding: 'utf8' });
}

try {
  if (fs.existsSync(envLocalPath)) {
    console.log('[setup-env] .env.local ya existe, no se modifica.');
    process.exit(0);
  }

  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envLocalPath);
    console.log('[setup-env] .env.local creado desde .env.example');
  } else {
    writeDefaults(envLocalPath);
    console.log('[setup-env] .env.local creado con valores por defecto');
  }
} catch (err) {
  console.error('[setup-env] Error creando .env.local:', err && err.message ? err.message : String(err));
  process.exit(0);
}