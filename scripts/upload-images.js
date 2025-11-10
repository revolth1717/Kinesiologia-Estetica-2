const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Configuración
const API_URL = "https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V";
const TREATMENTS_PATH = "/tratamientos";
const IMAGES_FOLDER = "./public/images/tratamientos"; // Carpeta con las imágenes

// Mapeo de nombres de archivo a IDs de tratamiento
// Ajusta estos valores según tus tratamientos en Xano
const IMAGE_MAPPING = {
  // Archivos provistos en public/images/tratamientos
  // ID según Xano:
  // 3: Láserlipólisis, 4: Cavitación, 5: Facial con radiofrecuencia, 6: Depilación láser
  "laserlipolisis.jpg": 3,
  "cavitacion.jpg": 4,
  "facialconradiofrecuencia.jpg": 5,
  "depilacionlaser.jpg": 6,

  // Aliases opcionales por si cambian nombres
  "radiofrecuencia.jpg": 5,
  "depilacion-laser.jpg": 6,
};

async function uploadImageToXano(filePath) {
  try {
    const formData = new FormData();
    formData.append('imagen', fs.createReadStream(filePath));
    
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Error uploading: ${response.status}`);
    }
    
    const data = await response.json();
    return data.url || data.path;
  } catch (error) {
    console.error('Error uploading image:', error);
    // Fallback: usar ruta local desde /public si el upload falla (por ejemplo 404)
    const publicPath = filePath.replace(/^(\.\/|\.\\)?public/, '');
    const localUrl = publicPath.startsWith('/') ? publicPath : `/${publicPath.replace(/\\/g, '/')}`;
    console.log(`⚠️  Usando ruta local como fallback: ${localUrl}`);
    return localUrl;
  }
}

async function updateTreatmentImage(treatmentId, imageUrl) {
  try {
    const response = await fetch(`${API_URL}${TREATMENTS_PATH}/${treatmentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imagen_url: imageUrl
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Error updating treatment: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating treatment:', error);
    throw error;
  }
}

async function processImages() {
  console.log('🚀 Iniciando carga de imágenes...');
  
  // Verificar que existe la carpeta de imágenes
  if (!fs.existsSync(IMAGES_FOLDER)) {
    console.error(`❌ La carpeta ${IMAGES_FOLDER} no existe`);
    console.log('💡 Crea la carpeta y coloca las imágenes de tratamientos ahí');
    return;
  }
  
  // Leer archivos de la carpeta
  const files = fs.readdirSync(IMAGES_FOLDER);
  const imageFiles = files.filter(file => 
    /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
  );
  
  if (imageFiles.length === 0) {
    console.log('❌ No se encontraron imágenes en la carpeta');
    return;
  }
  
  console.log(`📁 Encontradas ${imageFiles.length} imágenes:`);
  imageFiles.forEach(file => console.log(`   - ${file}`));
  
  // Procesar cada imagen
  for (const fileName of imageFiles) {
    const treatmentId = IMAGE_MAPPING[fileName];
    
    if (!treatmentId) {
      console.log(`⚠️  Saltando ${fileName} - no hay mapeo de ID`);
      continue;
    }
    
    try {
      console.log(`📤 Subiendo ${fileName} para tratamiento ID ${treatmentId}...`);
      
      const filePath = path.join(IMAGES_FOLDER, fileName);
      const imageUrl = await uploadImageToXano(filePath);
      
      console.log(`✅ Imagen subida: ${imageUrl}`);
      
      await updateTreatmentImage(treatmentId, imageUrl);
      
      console.log(`✅ Tratamiento ${treatmentId} actualizado con imagen`);
      
      // Pausa entre uploads para no sobrecargar la API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error procesando ${fileName}:`, error.message);
    }
  }
  
  console.log('🎉 ¡Proceso completado!');
}

// Función para obtener tratamientos y mostrar IDs
async function listTreatments() {
  try {
    console.log('📋 Obteniendo lista de tratamientos...');
    
    const response = await fetch(`${API_URL}${TREATMENTS_PATH}`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    const treatments = Array.isArray(data) ? data : (data.items ?? data.results ?? []);
    
    console.log('\n📋 Tratamientos disponibles:');
    console.log('ID | Nombre | Imagen Actual');
    console.log('---|--------|---------------');
    
    treatments.forEach(t => {
      const hasImage = t.imagen_url ? '✅' : '❌';
      console.log(`${t.id.toString().padEnd(2)} | ${t.nombre.padEnd(30)} | ${hasImage}`);
    });
    
    console.log('\n💡 Actualiza IMAGE_MAPPING con los IDs correctos');
    
  } catch (error) {
    console.error('❌ Error obteniendo tratamientos:', error.message);
  }
}

// Ejecutar según el argumento
const command = process.argv[2];

if (command === 'list') {
  listTreatments();
} else if (command === 'upload') {
  processImages();
} else {
  console.log('📖 Uso del script:');
  console.log('  node scripts/upload-images.js list     - Ver tratamientos y sus IDs');
  console.log('  node scripts/upload-images.js upload   - Subir imágenes');
  console.log('');
  console.log('📁 Estructura esperada:');
  console.log('  public/images/tratamientos/');
  console.log('  ├── depilacion-laser.jpg');
  console.log('  ├── masaje-terapeutico.jpg');
  console.log('  └── tratamiento-facial.jpg');
}