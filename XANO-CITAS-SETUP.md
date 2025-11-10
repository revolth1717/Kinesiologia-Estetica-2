# Configuración de Endpoints de Citas en Xano

## 📋 Resumen
Esta guía te ayudará a configurar los endpoints necesarios para el sistema de citas en Xano.

## 🗄️ Estructura de la Tabla `appointment`

### Estructura Existente:
La tabla `appointment` ya existe en Xano con la siguiente estructura:

```sql
CREATE TABLE appointment (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER NOT NULL,
  appointment_date TIMESTAMP NOT NULL,
  status VARCHAR(255) DEFAULT 'pendiente',
  service VARCHAR(255) NOT NULL,
  comments TEXT
);
```

### Campos de la Tabla:

| Campo | Tipo | Configuración |
|-------|------|---------------|
| `id` | Integer | Primary Key, Auto Increment |
| `created_at` | Timestamp | Auto-generated |
| `user_id` | Integer | Required, Foreign Key to users |
| `appointment_date` | Timestamp | Required (fecha y hora combinadas) |
| `status` | Text | Default: "pendiente" |
| `service` | Text | Required |
| `comments` | Text | Optional |

## 🔗 Endpoints a Configurar

### 1. GET /appointment/user
**Propósito**: Obtener todas las citas del usuario autenticado

#### Configuración en Xano:
1. **Ve a "API" → "Add Endpoint"**
2. **Método**: GET
3. **Ruta**: `/citas/usuario`
4. **Autenticación**: Requerida (Bearer Token)

#### Lógica del Endpoint:
```javascript
// 1. Verificar autenticación
const user = request.user; // Usuario autenticado automáticamente por Xano

// 2. Consultar citas del usuario
const citas = await xano.db.citas.getMany({
  usuario_id: user.id
}, {
  sort: [{ created_at: 'desc' }]
});

// 3. Retornar citas
return citas;
```

#### Respuesta Esperada:
```json
[
  {
    "id": 1,
    "fecha": "2024-01-15",
    "hora": "10:00",
    "servicio": "Limpieza Facial",
    "estado": "pendiente",
    "ubicacion": "Consultorio Principal",
    "usuario_id": 123,
    "tratamiento_id": "facial-limpieza",
    "notas": "Primera sesión",
    "created_at": "2024-01-10T09:00:00Z",
    "updated_at": "2024-01-10T09:00:00Z"
  }
]
```

### 2. POST /appointment
**Propósito**: Crear una nueva cita

#### Configuración en Xano:
1. **Ve a "API" → "Add Endpoint"**
2. **Método**: POST
3. **Ruta**: `/appointment`
4. **Autenticación**: Requerida (Bearer Token)

#### Parámetros de Entrada:
```json
{
  "appointment_date": "2024-01-15T10:00:00.000Z",
  "service": "Limpieza Facial",
  "comments": "Primera sesión"
}
```

#### Lógica del Endpoint:
```javascript
// 1. Verificar autenticación
const user = request.user;

// 2. Validar datos requeridos
if (!request.body.appointment_date || !request.body.service) {
  return response.status(400).json({
    error: "Fecha de cita y servicio son requeridos"
  });
}

// 3. Crear la cita
const nuevaCita = await xano.db.appointment.create({
  appointment_date: request.body.appointment_date,
  service: request.body.service,
  status: "pendiente",
  user_id: user.id,
  comments: request.body.comments
});

// 4. Retornar la cita creada
return nuevaCita;
```

#### Respuesta Esperada:
```json
{
  "id": 1,
  "appointment_date": "2024-01-15T10:00:00.000Z",
  "service": "Limpieza Facial",
  "status": "pendiente",
  "user_id": 123,
  "comments": "Primera sesión",
  "created_at": "2024-01-10T09:00:00Z"
}
```

### 3. PATCH /appointment/{id}
**Propósito**: Actualizar una cita existente (principalmente para cancelar)

#### Configuración en Xano:
1. **Ve a "API" → "Add Endpoint"**
2. **Método**: PATCH
3. **Ruta**: `/appointment/{id}`
4. **Autenticación**: Requerida (Bearer Token)

#### Parámetros de Entrada:
```json
{
  "status": "cancelada"
}
```

#### Lógica del Endpoint:
```javascript
// 1. Verificar autenticación
const user = request.user;
const appointmentId = request.params.id;

// 2. Verificar que la cita existe y pertenece al usuario
const cita = await xano.db.appointment.getFirst({
  id: appointmentId,
  user_id: user.id
});

if (!cita) {
  return response.status(404).json({
    error: "Cita no encontrada"
  });
}

// 3. Actualizar la cita
const citaActualizada = await xano.db.appointment.update(appointmentId, {
  ...request.body
});

// 4. Retornar la cita actualizada
return citaActualizada;
```

#### Respuesta Esperada:
```json
{
  "id": 1,
  "appointment_date": "2024-01-15T10:00:00.000Z",
  "service": "Limpieza Facial",
  "status": "cancelada",
  "user_id": 123,
  "comments": "Primera sesión",
  "created_at": "2024-01-10T09:00:00Z"
}
```

## 🔧 Configuración Paso a Paso

### Paso 1: Crear la Tabla
1. Accede a tu workspace de Xano
2. Ve a "Database"
3. Haz clic en "Add Table"
4. Nombra la tabla: `citas`
5. Agrega todos los campos según la tabla anterior

### Paso 2: Configurar Relaciones
1. En la tabla `citas`, configura la relación con `users`:
   - Campo: `usuario_id`
   - Tipo: Many to One
   - Tabla relacionada: `users`

### Paso 3: Crear los Endpoints
1. Ve a "API"
2. Selecciona el workspace correcto (debe usar la URL: `https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V`)
3. Crea cada endpoint siguiendo las especificaciones anteriores

### Paso 4: Configurar Autenticación
1. En cada endpoint, habilita "Authentication Required"
2. Selecciona el método de autenticación por Bearer Token
3. Asegúrate de que esté conectado con tu sistema de usuarios

### Paso 5: Probar los Endpoints
1. Usa el "API Playground" de Xano para probar cada endpoint
2. Verifica que las respuestas coincidan con lo esperado
3. Prueba casos de error (sin autenticación, datos inválidos, etc.)

## 🧪 Pruebas Recomendadas

### Test 1: Crear Cita
```bash
POST /citas
Authorization: Bearer {token}
Content-Type: application/json

{
  "fecha": "2024-01-15",
  "hora": "10:00",
  "servicio": "Limpieza Facial",
  "ubicacion": "Consultorio Principal"
}
```

### Test 2: Obtener Citas del Usuario
```bash
GET /citas/usuario
Authorization: Bearer {token}
```

### Test 3: Cancelar Cita
```bash
PATCH /citas/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "estado": "cancelada"
}
```

## ⚠️ Consideraciones Importantes

1. **Autenticación**: Todos los endpoints requieren autenticación
2. **Validación**: Valida siempre que el usuario solo acceda a sus propias citas
3. **Fechas**: Usa formato ISO para fechas (YYYY-MM-DD)
4. **Horas**: Usa formato 24 horas (HH:MM)
5. **Estados**: Solo permite los estados definidos: "confirmada", "pendiente", "cancelada"

## 🔍 Troubleshooting

### Error 404 en endpoints
- Verifica que la ruta esté correctamente configurada
- Asegúrate de estar usando la URL correcta del workspace

### Error 401/403 en autenticación
- Verifica que el token se esté enviando correctamente
- Confirma que el sistema de autenticación esté funcionando

### Error 500 en creación de citas
- Revisa que todos los campos requeridos estén presentes
- Verifica que la tabla `citas` esté correctamente configurada

## 📞 Próximos Pasos

Una vez configurados los endpoints:
1. Probar desde la aplicación web
2. Verificar que las citas aparezcan en el perfil
3. Confirmar que la cancelación funcione correctamente
4. Actualizar la documentación de API

---

**Nota**: Esta configuración permitirá que el sistema de citas funcione completamente con la base de datos de Xano, reemplazando el sistema de localStorage actual.