"use client";

import { useState, useEffect } from "react";
import { Upload, Save, Trash2, Eye, Edit } from "lucide-react";
import AdminNav from "@/components/AdminNav";

type Tratamiento = {
  id: number;
  nombre: string;
  slug?: string;
  tipo: "unico" | "multi_zona";
  precio_1_sesion: number;
  precio_8_sesiones: number;
  duracion_minutos: number;
  imagen_url?: string;
};

export default function AdminTratamientosPage() {
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_XANO_CONTENT_API;
  const CONTENT_API_URL = process.env.NEXT_PUBLIC_XANO_CONTENT_API || API_URL;
  const TREATMENTS_PATH = process.env.NEXT_PUBLIC_TREATMENTS_PATH || "/tratamientos";
  const LOCAL_TREATMENTS_URL = "/api/tratamientos";

  // Cargar tratamientos
  useEffect(() => {
    loadTratamientos();
  }, []);

  const loadTratamientos = async () => {
    if (!API_URL) {
      setError("Falta configurar NEXT_PUBLIC_API_URL en .env.local");
      setLoading(false);
      return;
    }
    
    try {
      console.log('🔄 Cargando tratamientos desde proxy local:', `${LOCAL_TREATMENTS_URL}`);
      const res = await fetch(LOCAL_TREATMENTS_URL);
      console.log('📥 Respuesta loadTratamientos:', res.status, res.statusText);
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('✅ Datos recibidos:', data);
      
      const list = Array.isArray(data) ? data : (data.items ?? data.results ?? []);
      setTratamientos(list);
      console.log('📋 Tratamientos cargados:', list.length);
      setError(null);
    } catch (e: any) {
      console.error('❌ Error en loadTratamientos:', e);
      setError(e.message || "Error cargando tratamientos");
    } finally {
      setLoading(false);
    }
  };

  // Función para subir imagen a Xano
  const handleImageUpload = async (tratamientoId: number, file: File) => {
    if (!API_URL) {
      alert("Error: Falta configurar NEXT_PUBLIC_API_URL en .env.local");
      return;
    }
    
    // Validar archivo
    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert("Error: El archivo es demasiado grande. Máximo 5MB.");
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert("Error: Formato no soportado. Use JPG, PNG, GIF o WebP.");
      return;
    }
    
    setUploadingId(tratamientoId);
    
    try {
      console.log('🚀 Iniciando carga de imagen:', file.name, 'para tratamiento ID:', tratamientoId);
      
      // Crear FormData para la imagen
      const formData = new FormData();
      formData.append('imagen', file);
      
      console.log('📤 Subiendo a:', `${API_URL}/upload`);
      
      // Subir imagen a Xano
      const uploadRes = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      console.log('📥 Respuesta upload:', uploadRes.status, uploadRes.statusText);
      
      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        console.error('❌ Error en upload:', errorText);
        throw new Error(`Error ${uploadRes.status}: ${errorText || 'Error subiendo imagen'}`);
      }
      
      const uploadData = await uploadRes.json();
      console.log('✅ Datos de upload:', uploadData);
      
      const imageUrl = uploadData.url || uploadData.path || uploadData.imagen_url;
      
      if (!imageUrl) {
        throw new Error('No se recibió URL de imagen del servidor');
      }
      
      console.log('🔗 URL de imagen:', imageUrl);
      console.log('🔄 Actualizando tratamiento en:', `${CONTENT_API_URL}${TREATMENTS_PATH}/${tratamientoId}`);
      
      // Actualizar el tratamiento con la URL de la imagen
      const updateRes = await fetch(`${CONTENT_API_URL}${TREATMENTS_PATH}/${tratamientoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imagen_url: imageUrl
        }),
      });
      
      console.log('📥 Respuesta update:', updateRes.status, updateRes.statusText);
      
      if (!updateRes.ok) {
        const errorText = await updateRes.text();
        console.error('❌ Error en update:', errorText);
        throw new Error(`Error ${updateRes.status}: ${errorText || 'Error actualizando tratamiento'}`);
      }
      
      // Recargar tratamientos
      await loadTratamientos();
      
      console.log('🎉 ¡Imagen subida exitosamente!');
      alert('¡Imagen subida exitosamente!');
      
    } catch (error: any) {
      console.error('💥 Error completo:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setUploadingId(null);
    }
  };

  // Función para eliminar imagen
  const handleRemoveImage = async (tratamientoId: number) => {
    if (!CONTENT_API_URL || !confirm('¿Estás seguro de eliminar esta imagen?')) return;
    
    try {
      const updateRes = await fetch(`${CONTENT_API_URL}${TREATMENTS_PATH}/${tratamientoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imagen_url: null
        }),
      });
      
      if (!updateRes.ok) throw new Error('Error eliminando imagen');
      
      await loadTratamientos();
      alert('Imagen eliminada exitosamente!');
      
    } catch (error: any) {
      console.error('Error:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Función para abrir imagen en nueva pestaña de forma segura
  const handleViewImage = (imageUrl: string) => {
    try {
      if (imageUrl && typeof imageUrl === 'string') {
        window.open(imageUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error abriendo imagen:', error);
      alert('Error al abrir la imagen');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tratamientos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={loadTratamientos}
            className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminNav />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Administrar Imágenes de Tratamientos</h1>
          <p className="text-gray-600 mt-2">Sube y gestiona las imágenes de tus tratamientos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tratamientos.map((tratamiento) => (
            <div key={tratamiento.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Imagen actual o placeholder */}
              <div className="h-48 bg-gray-100 relative">
                {tratamiento.imagen_url ? (
                  <img 
                    src={tratamiento.imagen_url} 
                    alt={tratamiento.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Upload className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">Sin imagen</p>
                    </div>
                  </div>
                )}
                
                {/* Overlay con acciones */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  {tratamiento.imagen_url && (
                    <button
                      onClick={() => handleViewImage(tratamiento.imagen_url!)}
                      className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
                      title="Ver imagen"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  
                  <label className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 cursor-pointer" title="Subir imagen">
                    <Upload className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(tratamiento.id, file);
                        }
                      }}
                      disabled={uploadingId === tratamiento.id}
                    />
                  </label>
                  
                  {tratamiento.imagen_url && (
                    <button
                      onClick={() => handleRemoveImage(tratamiento.id)}
                      className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                      title="Eliminar imagen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {/* Indicador de carga */}
                {uploadingId === tratamiento.id && (
                  <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="text-sm">Subiendo...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Información del tratamiento */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{tratamiento.nombre}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Tipo: {tratamiento.tipo === "multi_zona" ? "Multi-zona" : "Único"}</p>
                  <p>Duración: {tratamiento.duracion_minutos} min</p>
                  <p>Precio 1 sesión: ${tratamiento.precio_1_sesion?.toLocaleString()}</p>
                  {tratamiento.precio_8_sesiones && (
                    <p>Precio 8 sesiones: ${tratamiento.precio_8_sesiones.toLocaleString()}</p>
                  )}
                </div>
                
                {/* Estado de la imagen */}
                <div className="mt-3 flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    tratamiento.imagen_url ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className={`text-sm ${
                    tratamiento.imagen_url ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tratamiento.imagen_url ? 'Con imagen' : 'Sin imagen'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {tratamientos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay tratamientos disponibles</p>
          </div>
        )}
      </div>
    </div>
  );
}