/**
 * Script de Prueba para Endpoints de Citas
 * 
 * Este script te ayuda a probar los endpoints de citas una vez configurados en Xano.
 * Ejecuta: node scripts/test-citas-endpoints.js
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V";

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Token de prueba (debes reemplazarlo con un token válido)
let authToken = null;

async function testEndpoint(method, endpoint, data = null, description = '') {
  log(`\n${colors.bold}🧪 Probando: ${description}${colors.reset}`, 'blue');
  log(`${method} ${endpoint}`, 'yellow');
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      }
    };
    
    if (data && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
      log(`Datos enviados: ${JSON.stringify(data, null, 2)}`, 'yellow');
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    log(`Status: ${response.status} ${response.statusText}`, 
        response.ok ? 'green' : 'red');
    
    if (response.ok) {
      const result = await response.json();
      log(`✅ Respuesta exitosa:`, 'green');
      console.log(JSON.stringify(result, null, 2));
      return result;
    } else {
      const error = await response.text();
      log(`❌ Error: ${error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Error de conexión: ${error.message}`, 'red');
    return null;
  }
}

async function runTests() {
  log(`${colors.bold}🚀 Iniciando pruebas de endpoints de citas${colors.reset}`, 'blue');
  log(`URL Base: ${API_BASE_URL}`, 'yellow');
  
  // Nota sobre el token
  log(`\n⚠️  IMPORTANTE: Para probar los endpoints, necesitas un token de autenticación válido.`, 'yellow');
  log(`   Puedes obtenerlo desde la aplicación web (localStorage.getItem('authToken'))`, 'yellow');
  log(`   O configurar uno directamente en este script.`, 'yellow');
  
  if (!authToken) {
    log(`\n❌ No se ha configurado un token de autenticación.`, 'red');
    log(`   Configura la variable 'authToken' en este script para continuar.`, 'red');
    return;
  }
  
  // Test 1: Obtener citas del usuario
  log(`\n${'='.repeat(60)}`, 'blue');
  const citas = await testEndpoint(
    'GET', 
    '/appointment/user', 
    null, 
    'Obtener citas del usuario autenticado'
  );
  
  // Test 2: Crear una nueva cita
  log(`\n${'='.repeat(60)}`, 'blue');
  const nuevaCita = {
    appointment_date: Date.now() + 7 * 24 * 60 * 60 * 1000, // milisegundos
    service: "Limpieza Facial de Prueba",
    comments: "Cita de prueba creada por script"
  };
  
  const citaCreada = await testEndpoint(
    'POST', 
    '/appointment', 
    nuevaCita, 
    'Crear una nueva cita'
  );
  
  // Test 3: Actualizar la cita creada (si se creó exitosamente)
  if (citaCreada && citaCreada.id) {
    log(`\n${'='.repeat(60)}`, 'blue');
    const actualizacion = {
      status: "cancelada"
    };
    
    await testEndpoint(
      'PATCH', 
      `/appointment/${citaCreada.id}`, 
      actualizacion, 
      'Cancelar la cita creada'
    );
  }
  
  // Test 4: Verificar citas después de las operaciones
  log(`\n${'='.repeat(60)}`, 'blue');
  await testEndpoint(
    'GET', 
    '/appointment/user', 
    null, 
    'Verificar citas después de las operaciones'
  );
  
  log(`\n${colors.bold}✅ Pruebas completadas${colors.reset}`, 'green');
}

// Configuración del token (reemplaza con un token válido)
async function configurarToken() {
  // Opción 1: Token hardcodeado (NO recomendado para producción)
  // authToken = "tu_token_aqui";
  
  // Opción 2: Leer desde variable de entorno
  authToken = process.env.AUTH_TOKEN;
  
  // Opción 3: Solicitar al usuario (requiere readline)
  if (!authToken) {
    log(`\n📝 Para obtener un token de autenticación:`, 'yellow');
    log(`   1. Abre la aplicación web en el navegador`, 'yellow');
    log(`   2. Inicia sesión con tu cuenta`, 'yellow');
    log(`   3. Abre las herramientas de desarrollador (F12)`, 'yellow');
    log(`   4. Ve a la consola y ejecuta: localStorage.getItem('authToken')`, 'yellow');
    log(`   5. Copia el token y configúralo en este script`, 'yellow');
  }
}

// Función principal
async function main() {
  await configurarToken();
  await runTests();
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testEndpoint,
  runTests,
  configurarToken
};