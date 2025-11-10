# Configuración de API - Kinesiología Estética Pro

## URLs de Xano

### URL Principal (Endpoints Generales)
```
https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V
```
Configurada en `NEXT_PUBLIC_API_URL` para endpoints generales como citas, usuarios, etc.

### URL de Autenticación
```
https://x8ki-letl-twmt.n7.xano.io/api:-E-1dvfg
```
Configurada en `NEXT_PUBLIC_AUTH_URL` específicamente para endpoints de autenticación.

## Configuración de Variables de Entorno

En `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V
NEXT_PUBLIC_AUTH_URL=https://x8ki-letl-twmt.n7.xano.io/api:-E-1dvfg
```

## Endpoints por URL

### Autenticación (AUTH_URL)
- `POST /auth/login` - Iniciar sesión ✅ **Configurado**
- `POST /auth/signup` - Registrar usuario ✅ **Configurado**
- `GET /auth/me` - Obtener información del usuario actual ✅ **Configurado**

### Citas y Otros (API_URL)
- `GET /citas/usuario` - Obtener citas del usuario autenticado ⏳ **En configuración**
- `POST /citas` - Crear nueva cita ⏳ **En configuración**
- `PATCH /citas/{id}` - Actualizar cita ⏳ **En configuración**

## Estado Actual

✅ **Conexión Base**: Ambas URLs de Xano son accesibles
✅ **Endpoints de Autenticación**: Configurados y funcionando (devuelven 403/401 como esperado)
❌ **Endpoints de Citas**: Pendientes de configuración

## Implementación en el Código

### AuthContext.tsx
```javascript
const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://x8ki-letl-twmt.n7.xano.io/api:-E-1dvfg';
```

### ApiDiagnostic.ts
```javascript
static readonly AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://x8ki-letl-twmt.n7.xano.io/api:-E-1dvfg';
```

## Especificaciones de Endpoints

### 1. Autenticación

#### `/auth/login` (POST)
- **Propósito**: Iniciar sesión de usuario
- **Parámetros esperados**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Respuesta esperada**:
  ```json
  {
    "authToken": "string",
    "user": {
      "id": "number",
      "email": "string",
      "name": "string"
    }
  }
  ```

#### `/auth/signup` (POST)
- **Propósito**: Registro de nuevo usuario
- **Parámetros esperados**:
  ```json
  {
    "email": "string",
    "password": "string",
    "name": "string"
  }
  ```
- **Respuesta esperada**:
  ```json
  {
    "authToken": "string",
    "user": {
      "id": "number",
      "email": "string",
      "name": "string"
    }
  }
  ```

#### `/auth/me` (GET)
- **Propósito**: Obtener información del usuario autenticado
- **Headers requeridos**:
  ```
  Authorization: Bearer {authToken}
  ```
- **Respuesta esperada**:
  ```json
  {
    "id": "number",
    "email": "string",
    "name": "string"
  }
  ```

### 2. Gestión de Citas

#### `/citas/usuario` (GET)
- **Propósito**: Obtener citas del usuario autenticado
- **Headers requeridos**:
  ```
  Authorization: Bearer {authToken}
  ```
- **Respuesta esperada**:
  ```json
  [
    {
      "id": "number",
      "fecha": "string (ISO date)",
      "hora": "string",
      "servicio": "string",
      "estado": "string",
      "ubicacion": "string",
      "usuario_id": "number",
      "tratamiento_id": "string",
      "notas": "string",
      "created_at": "string (ISO datetime)",
      "updated_at": "string (ISO datetime)"
    }
  ]
  ```

#### `/citas` (POST)
- **Propósito**: Crear una nueva cita
- **Headers requeridos**:
  ```
  Authorization: Bearer {authToken}
  Content-Type: application/json
  ```
- **Parámetros esperados**:
  ```json
  {
    "fecha": "string (ISO date)",
    "hora": "string (HH:MM)",
    "servicio": "string",
    "ubicacion": "string (opcional)",
    "tratamiento_id": "string (opcional)",
    "notas": "string (opcional)"
  }
  ```
- **Respuesta esperada**:
  ```json
  {
    "id": "number",
    "fecha": "string (ISO date)",
    "hora": "string",
    "servicio": "string",
    "estado": "pendiente",
    "ubicacion": "string",
    "usuario_id": "number",
    "tratamiento_id": "string",
    "notas": "string",
    "created_at": "string (ISO datetime)",
    "updated_at": "string (ISO datetime)"
  }
  ```

#### `/citas/{id}` (PATCH)
- **Propósito**: Actualizar una cita existente (principalmente para cancelar)
- **Headers requeridos**:
  ```
  Authorization: Bearer {authToken}
  Content-Type: application/json
  ```
- **Parámetros esperados**:
  ```json
  {
    "estado": "string (confirmada|pendiente|cancelada)"
  }
  ```
- **Respuesta esperada**:
  ```json
  {
    "id": "number",
    "fecha": "string (ISO date)",
    "hora": "string",
    "servicio": "string",
    "estado": "string",
    "ubicacion": "string",
    "usuario_id": "number",
    "tratamiento_id": "string",
    "notas": "string",
    "created_at": "string (ISO datetime)",
    "updated_at": "string (ISO datetime)"
  }
  ```

## Cómo Verificar la Configuración

1. **Accede a la página de perfil** en la aplicación
2. **Haz clic en "Probar API"**
3. **Revisa el diagnóstico**:
   - ✅ Conexión base debe estar OK
   - ❌ Los endpoints de autenticación mostrarán "No configurado" hasta que los configures en Xano

## Pasos para Configurar en Xano

1. **Accede a tu panel de Xano**
2. **Crea las tablas necesarias**:
   - `users` (para autenticación)
   - `citas` (para gestión de citas)
3. **Configura los endpoints de autenticación**:
   - Usa las plantillas de autenticación de Xano
   - Asegúrate de que las rutas coincidan con las especificadas arriba
4. **Configura los endpoints de citas**:
   - Crea endpoints para CRUD de citas
   - Implementa filtros por usuario autenticado

## Variables de Entorno

Asegúrate de que tu archivo `.env.local` contenga:

```env
NEXT_PUBLIC_API_URL=https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V
```

## Diagnóstico de Problemas

Si encuentras errores:

1. **Error 404 en endpoints**: Los endpoints no están configurados en Xano
2. **Error de CORS**: Configura los dominios permitidos en Xano
3. **Error de autenticación**: Verifica que el token se esté enviando correctamente

## Próximos Pasos

1. ✅ Configurar los endpoints de autenticación en Xano
2. ⏳ Configurar los endpoints de citas en Xano (ver XANO-CITAS-SETUP.md)
3. ❌ Probar la funcionalidad completa de autenticación
4. ❌ Probar la funcionalidad completa de citas

## Notas

- El diagnóstico de API está disponible en `/diagnostico`
- Los endpoints de autenticación devuelven errores 403/401, lo cual es correcto (requieren datos válidos)
- Los errores de endpoints de citas son esperados hasta completar la configuración en Xano
- La aplicación usa dos URLs diferentes para separar la autenticación de otros servicios

---

**Nota**: Esta documentación se actualizará conforme se configuren más endpoints en la API.