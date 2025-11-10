# 📸 Guía para Cargar Imágenes de Tratamientos

Esta guía te explica cómo cargar imágenes para tus tratamientos en la base de datos de Xano.

## 🎯 Opciones Disponibles

### **Opción 1: Interfaz de Administración (Recomendada)**
Una interfaz web fácil de usar para subir imágenes una por una.

**Acceso:** `http://localhost:3000/admin/tratamientos`

**Características:**
- ✅ Interfaz visual intuitiva
- ✅ Vista previa de imágenes
- ✅ Carga individual por tratamiento
- ✅ Eliminación de imágenes
- ✅ Estado en tiempo real

### **Opción 2: Script de Carga Masiva**
Para cargar múltiples imágenes de una vez desde una carpeta.

## 🚀 Cómo Usar la Interfaz de Administración

1. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Ve a la página de administración:**
   ```
   http://localhost:3000/admin/tratamientos
   ```

3. **Sube imágenes:**
   - Haz clic en el ícono de "Upload" sobre cada tratamiento
   - Selecciona una imagen (JPG, PNG, GIF, WebP)
   - La imagen se subirá automáticamente a Xano
   - Verás una confirmación cuando termine

4. **Gestiona imágenes:**
   - 👁️ **Ver:** Abre la imagen en una nueva pestaña
   - 🗑️ **Eliminar:** Quita la imagen del tratamiento
   - ✅ **Estado:** Verde = con imagen, Rojo = sin imagen

## 📁 Cómo Usar el Script de Carga Masiva

### **Paso 1: Preparar las Imágenes**

1. **Coloca tus imágenes en:**
   ```
   public/images/tratamientos/
   ```

2. **Formatos soportados:**
   - JPG, JPEG, PNG, GIF, WebP
   - Tamaño recomendado: 800x600px o similar
   - Peso máximo: 2MB por imagen

3. **Nombres de archivo sugeridos:**
   ```
   depilacion-laser.jpg
   masaje-terapeutico.jpg
   tratamiento-facial.jpg
   drenaje-linfatico.jpg
   radiofrecuencia.jpg
   ```

### **Paso 2: Obtener IDs de Tratamientos**

```bash
node scripts/upload-images.js list
```

Esto te mostrará:
```
📋 Tratamientos disponibles:
ID | Nombre                        | Imagen Actual
---|-------------------------------|---------------
1  | Depilación Láser             | ❌
2  | Masaje Terapéutico           | ❌
3  | Tratamiento Facial           | ✅
```

### **Paso 3: Configurar el Mapeo**

Edita el archivo `scripts/upload-images.js` y actualiza `IMAGE_MAPPING`:

```javascript
const IMAGE_MAPPING = {
  "depilacion-laser.jpg": 1,        // ID del tratamiento en Xano
  "masaje-terapeutico.jpg": 2,
  "tratamiento-facial.jpg": 3,
  "drenaje-linfatico.jpg": 4,
  // Agrega más según tus tratamientos
};
```

### **Paso 4: Ejecutar la Carga**

```bash
node scripts/upload-images.js upload
```

Verás el progreso:
```
🚀 Iniciando carga de imágenes...
📁 Encontradas 3 imágenes:
   - depilacion-laser.jpg
   - masaje-terapeutico.jpg
   - tratamiento-facial.jpg

📤 Subiendo depilacion-laser.jpg para tratamiento ID 1...
✅ Imagen subida: https://xano.com/uploads/imagen123.jpg
✅ Tratamiento 1 actualizado con imagen

🎉 ¡Proceso completado!
```

## 🔧 Configuración de Xano

### **Endpoint de Upload**
Asegúrate de que tu Xano tenga configurado el endpoint `/upload` para recibir archivos.

### **Campo imagen_url**
Tu tabla de tratamientos debe tener un campo `imagen_url` de tipo texto para almacenar la URL de la imagen.

### **Estructura de la Tabla Tratamientos**
```
- id (int, primary key)
- nombre (text)
- slug (text, optional)
- tipo (text: "unico" | "multi_zona")
- precio_1_sesion (int)
- precio_8_sesiones (int)
- duracion_minutos (int)
- imagen_url (text) ← Este campo es importante
```

## 🎨 Recomendaciones para las Imágenes

### **Dimensiones:**
- **Ancho:** 800-1200px
- **Alto:** 600-900px
- **Proporción:** 4:3 o 16:9

### **Calidad:**
- **Formato:** JPG para fotos, PNG para gráficos
- **Compresión:** 80-90% para JPG
- **Peso:** Máximo 2MB por imagen

### **Contenido:**
- Imágenes profesionales y de alta calidad
- Relacionadas directamente con el tratamiento
- Buena iluminación y composición
- Sin marcas de agua o logos externos

## 🔍 Verificación

Después de cargar las imágenes, verifica que funcionen:

1. **Ve a la página de agendamiento:**
   ```
   http://localhost:3000/agendar/nombre-del-tratamiento
   ```

2. **Comprueba que la imagen se muestre correctamente**

3. **Si no se muestra:**
   - Verifica que la URL en Xano sea correcta
   - Comprueba que la imagen sea accesible públicamente
   - Revisa la consola del navegador para errores

## 🆘 Solución de Problemas

### **Error: "Falta configurar NEXT_PUBLIC_API_URL"**
- Verifica que `.env.local` tenga la URL correcta de Xano

### **Error: "Error uploading: 404"**
- El endpoint `/upload` no existe en tu Xano
- Configura el endpoint de upload en Xano

### **Error: "Error updating treatment: 404"**
- El ID del tratamiento no existe
- Ejecuta `node scripts/upload-images.js list` para ver IDs correctos

### **Las imágenes no se muestran en el frontend**
- Verifica que las URLs sean públicamente accesibles
- Comprueba la configuración de CORS en Xano
- Revisa la consola del navegador para errores

## 📞 Soporte

Si tienes problemas:

1. **Revisa los logs** en la consola del navegador
2. **Verifica la configuración** de Xano
3. **Comprueba las URLs** de las imágenes manualmente
4. **Usa la interfaz de administración** como alternativa al script

---

¡Con esta guía deberías poder cargar todas las imágenes de tus tratamientos exitosamente! 🎉