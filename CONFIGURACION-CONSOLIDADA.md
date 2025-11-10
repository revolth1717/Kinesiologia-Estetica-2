# Configuración consolidada - Kinesiología Estética Pro

Este documento refleja la configuración actualizada de variables y endpoints usados por la app, para evitar errores de configuración.

## URLs de Xano

- `NEXT_PUBLIC_API_URL` → Base de endpoints generales (citas, contenido)
- `NEXT_PUBLIC_AUTH_URL` → Base de endpoints de autenticación

Ejemplo (ajusta a tu proyecto):
```
NEXT_PUBLIC_API_URL=https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V
NEXT_PUBLIC_AUTH_URL=https://x8ki-letl-twmt.n7.xano.io/api:-E-1dvfg
```

## Variables de Entorno (Agendar y Disponibilidad)

En `.env.local` o usando `.env.example` como base:
```env
NEXT_PUBLIC_OPEN_HOUR=10
NEXT_PUBLIC_CLOSE_HOUR=19
NEXT_PUBLIC_SLOT_MINUTES=60
NEXT_PUBLIC_CLOSED_WEEKDAYS=0
NEXT_PUBLIC_ENABLE_GLOBAL_AVAILABILITY=false
```

- `NEXT_PUBLIC_OPEN_HOUR` y `NEXT_PUBLIC_CLOSE_HOUR`: definen el horario de atención.
- `NEXT_PUBLIC_SLOT_MINUTES`: tamaño de cada bloque horario.
- `NEXT_PUBLIC_CLOSED_WEEKDAYS`: lista CSV de días cerrados (0=Dom, 1=Lun, ..., 6=Sáb).
- `NEXT_PUBLIC_ENABLE_GLOBAL_AVAILABILITY`: si está en `false`, se bloquean horas solo con citas del usuario y carrito (sin consultar disponibilidad global).

## Endpoints usados por el Frontend

### Autenticación (AUTH_URL)
- `POST /auth/login` → Iniciar sesión
- `POST /auth/signup` → Registrar usuario
- `GET /auth/me` → Usuario actual

Headers: `Authorization: Bearer {authToken}` cuando corresponde.

### Citas (API_URL)
- `GET /appointment/user` → Citas del usuario autenticado
- `POST /appointment` → Crear nueva cita
- `PATCH /appointment/{id}` → Actualizar/cancelar cita

Estructuras típicas:
- Crear cita (`POST /appointment`):
```json
{
  "appointment_date": 1714502400000,
  "service": "Texto del servicio",
  "comments": "opcional"
}
```

- Actualizar cita (`PATCH /appointment/{id}`):
```json
{
  "status": "cancelada"
}
```

## Estado y Flujo implementado

- Agendar: genera horarios dinámicos con `src/utils/timeSlots.ts` y bloquea horas pasadas y tomadas.
- Carrito: `handleSubmitCita` añade la cita al carrito con precio y abono.
- Pago: simula pago y crea citas llamando `citasService.crearCita` por cada ítem del carrito; muestra progreso y errores inline.
- Perfil: permite cancelar cita con confirmación y refresco de la lista.

## Pruebas rápidas

1. Configura `.env.local` (puedes copiar de `.env.example`).
2. Inicia la app y abre `http://localhost:3002/agendar`.
3. Selecciona fecha y verifica horarios según reglas configuradas.
4. Añade una cita al carrito y ve a `Pago` para simular el flujo.
5. Verifica en `Perfil` la creación y cancelación.

Adicional: `scripts/test-citas-endpoints.js` permite probar `/appointment` con un `AUTH_TOKEN` válido.

## Notas

- La imagen remota de WebPay puede estar bloqueada por el navegador (ORB); no afecta el flujo. Si molesta, reemplázala por un activo local.
- El `authToken` se guarda en `localStorage` al registrarse/iniciar sesión.