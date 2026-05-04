# SmartAttendance

Sistema para **gestionar asistencia** en contextos académicos: profesores administran clases, generan **códigos QR** de sesión y marcan asistencia manual; los estudiantes **escanean el QR** y consultan su **historial**. La solución está dividida en **aplicación móvil/web (Expo / React Native)** y **API REST (Node.js / Express)** con **PostgreSQL**.

---

## Tabla de contenidos

1. [Características](#características)
2. [Arquitectura](#arquitectura)
3. [Stack tecnológico](#stack-tecnológico)
4. [Estructura del repositorio](#estructura-del-repositorio)
5. [Requisitos previos](#requisitos-previos)
6. [Base de datos](#base-de-datos)
7. [Configuración y ejecución del backend](#configuración-y-ejecución-del-backend)
8. [Configuración y ejecución de la app](#configuración-y-ejecución-de-la-app)
9. [Variables de entorno](#variables-de-entorno)
10. [API REST (resumen)](#api-rest-resumen)
11. [Docker (backend)](#docker-backend)
12. [Flujos principales](#flujos-principales)
13. [Seguridad y validación](#seguridad-y-validación)
14. [Solución de problemas](#solución-de-problemas)
15. [Estado del proyecto](#estado-del-proyecto)

---

## Características

- **Roles**: profesor y estudiante, con pantallas y permisos distintos.
- **Autenticación**: registro e inicio de sesión contra la API; sesión con **JWT**.
- **Clases**: creación, edición y eliminación (profesor).
- **Estudiantes en clase**: vincular estudiantes existentes a una clase; quitar de la clase.
- **Asistencia por QR**: el profesor genera un payload con vigencia; el estudiante escanea con la cámara y se registra en servidor (incluye identificador de dispositivo cuando está disponible).
- **Asistencia manual**: el profesor marca presente/ausente y guarda en lote.
- **Historial del estudiante**: lista de asistencias con fecha, clase y tipo (QR / manual).
- **Exportación**: reportes en CSV desde la app (profesor), según la implementación en `ExportView` y utilidades de exportación.

---

## Arquitectura

```
┌─────────────────────────┐         HTTPS/HTTP          ┌──────────────────────────┐
│  SmartAttendance-app    │  fetch (JSON + Bearer JWT)  │  SmartAttendance-backend │
│  Expo / React Native    │ ──────────────────────────► │  Express                 │
│  (iOS, Android, Web)    │                             │  + PostgreSQL            │
└─────────────────────────┘                             └──────────────────────────┘
```

- La **fuente de verdad** de usuarios, clases y asistencias es **PostgreSQL**, accedida solo desde el backend.
- La app usa un cliente centralizado en `SmartAttendance-app/services/api.js` con base URL configurable (`EXPO_PUBLIC_API_URL`).

---

## Stack tecnológico

### App (`SmartAttendance-app/`)

| Tecnología | Uso |
|------------|-----|
| [Expo](https://expo.dev/) | Toolchain y desarrollo multiplataforma |
| [React Native](https://reactnative.dev/) | UI nativa |
| [React Navigation](https://reactnavigation.org/) | Navegación entre pantallas |
| [expo-camera](https://docs.expo.dev/versions/latest/sdk/camera/) | Cámara y escaneo de QR |
| [expo-device](https://docs.expo.dev/versions/latest/sdk/device/) | Información del dispositivo (identificador auxiliar en asistencia QR) |
| [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) | Almacenamiento local auxiliar (p. ej. limpieza de claves heredadas) |

Versiones concretas: ver `SmartAttendance-app/package.json`.

### Backend (`SmartAttendance-backend/`)

| Tecnología | Uso |
|------------|-----|
| [Node.js](https://nodejs.org/) | Runtime |
| [Express](https://expressjs.com/) | API HTTP |
| [PostgreSQL](https://www.postgresql.org/) + [pg](https://node-postgres.com/) | Persistencia |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Hash de contraseñas |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | JWT |
| [cors](https://github.com/expressjs/cors) | CORS |
| [dotenv](https://github.com/motdotla/dotenv) | Variables de entorno |

---

## Estructura del repositorio

```
SmartAttendance/
├── README.md                 # Este documento
├── init.sql                  # Esquema SQL inicial (PostgreSQL)
├── package.json              # Dependencias mínimas a nivel raíz (si aplica)
├── SmartAttendance-app/      # Cliente Expo / React Native
│   ├── App.js
│   ├── index.js
│   ├── components/           # Pantallas y vistas por rol
│   ├── services/api.js       # Cliente HTTP hacia /api/*
│   ├── controllers/          # Lógica de negocio usada en flujos locales/UI
│   ├── models/               # Estado en memoria / compatibilidad (no sustituye al servidor)
│   ├── utils/                # Storage, fechas, QR, exportación CSV, etc.
│   └── theme/                # Colores y componentes de UI compartidos
└── SmartAttendance-backend/  # API REST
    ├── Dockerfile
    ├── src/
    │   ├── app.js            # Entrada Express, montaje de rutas
    │   ├── models/db.js      # Pool de PostgreSQL
    │   ├── middleware/auth.js
    │   ├── routes/           # auth, clases, estudiantes, asistencia, qr
    │   └── controllers/
    └── package.json
```

---

## Requisitos previos

- **Node.js** LTS (recomendado 20.x para alinearse con el Dockerfile del backend).
- **npm** (incluido con Node).
- **PostgreSQL** 14+ (recomendado).
- **Expo CLI** vía `npx` (no es obligatorio instalar globalmente).
- Para probar en **dispositivo físico**: la app debe poder alcanzar la URL del API (misma red Wi‑Fi; usar IP LAN del PC, no solo `localhost`).

---

## Base de datos

1. Crea una base de datos en PostgreSQL, por ejemplo `smartattendance`.
2. Ejecuta el script de esquema en la raíz del repo:

```bash
psql -U TU_USUARIO -d smartattendance -f init.sql
```

El archivo `init.sql` define tablas entre otras:

- `profesores`, `estudiantes`
- `clases`, `clase_estudiantes`
- `asistencias` (tipo `qr` o `manual`)
- `error_logs`

Los usuarios se crean normalmente por **registro desde la app** o insertando filas manualmente (las contraseñas deben estar **hasheadas** como espera el backend: ver `authController.js`).

---

## Configuración y ejecución del backend

```bash
cd SmartAttendance-backend
npm install
```

Crea un archivo **`.env`** en `SmartAttendance-backend/` (ver [Variables de entorno](#variables-de-entorno)).

```bash
# Desarrollo (recarga con nodemon)
npm run dev

# Producción simple
npm start
```

Por defecto el código usa `PORT` del entorno o **3000** si no está definido (`src/app.js`). La app móvil usa por defecto `http://localhost:5000/api` en emulador/simulador según `services/api.js`; para evitar confusiones, define **`PORT=5000`** en `.env` del backend o configura **`EXPO_PUBLIC_API_URL`** en la app apuntando al puerto real.

Comprueba salud del servidor:

```bash
curl http://localhost:PUERTO/health
```

Respuesta esperada: JSON con `ok: true`.

---

## Configuración y ejecución de la app

```bash
cd SmartAttendance-app
npm install
npx expo start
```

Luego elige plataforma en la terminal de Expo (web, Android, iOS) o escanea el QR con **Expo Go**.

**Importante**: si corres la app en un **teléfono físico**, `localhost` apunta al propio teléfono. Debes definir:

```bash
EXPO_PUBLIC_API_URL=http://TU_IP_LAN:PUERTO/api
```

antes de `expo start`, o usar un archivo `.env` compatible con Expo para variables `EXPO_PUBLIC_*`.

---

## Variables de entorno

### Backend (`SmartAttendance-backend/.env`)

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto HTTP del servidor (recomendado: `5000` si usas el default del cliente o Docker). |
| `DB_HOST` | Host de PostgreSQL (ej. `localhost`). |
| `DB_PORT` | Puerto PostgreSQL (por defecto `5432`). |
| `DB_USER` | Usuario de la base de datos. |
| `DB_PASSWORD` | Contraseña. |
| `DB_NAME` | Nombre de la base de datos. |
| `JWT_SECRET` | Secreto para firmar tokens (obligatorio en producción). |
| `JWT_EXPIRES_IN` | Caducidad del token (formato compatible con `jsonwebtoken`, ej. `7d`, `24h`). |

Ejemplo (ajusta valores):

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=smartattendance
DB_PASSWORD=smartattendance123
DB_NAME=smartattendance
JWT_SECRET=cambia_esto_por_un_secreto_largo_y_aleatorio
JWT_EXPIRES_IN=7d
```

### App (`EXPO_PUBLIC_*`)

| Variable | Descripción |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | URL base del API **incluyendo** el prefijo `/api`, p. ej. `http://192.168.1.10:5000/api`. Si no se define, el cliente usa el valor por defecto definido en `services/api.js`. |

---

## API REST (resumen)

Prefijo base: `/api` (montado en el código como `app.use("/api/auth", ...)`, etc.).

| Área | Rutas típicas | Notas |
|------|----------------|--------|
| Autenticación | `POST /api/auth/login`, `POST /api/auth/registro/estudiante`, `POST /api/auth/registro/profesor` | Devuelve `token` y datos de usuario. |
| Perfil | `PUT /api/auth/perfil/profesor`, `PUT /api/auth/perfil/estudiante` | Requiere JWT y rol adecuado. |
| Clases | `GET/POST /api/clases`, `PUT/DELETE /api/clases/:id` | Profesor autenticado. |
| Estudiantes | `GET /api/estudiantes/clase/:claseId`, `POST /api/estudiantes/vincular`, `DELETE ...` | Gestión de inscripción en clase. |
| Asistencia | `POST /api/asistencia/qr`, `POST /api/asistencia/manual`, `GET .../historial`, etc. | Lógica de registro y consultas. |
| QR | `POST /api/qr/generar` | Generación de sesión QR con duración configurable desde el cliente. |
| Salud | `GET /health` | Sin prefijo `/api` en `app.js` actual. |

Para el detalle exacto de cada ruta y cuerpo JSON, revisa `SmartAttendance-backend/src/routes/` y los controladores correspondientes.

---

## Docker (backend)

En `SmartAttendance-backend/Dockerfile` se expone el puerto **5000** y el healthcheck llama a `http://localhost:5000/health`. Asegúrate de que el proceso escuche ese puerto (`PORT=5000` en el entorno del contenedor) y de que la app apunte a la misma URL accesible desde el host o red.

Ejemplo genérico (ajusta nombres de red y variables):

```bash
cd SmartAttendance-backend
docker build -t smartattendance-api .
docker run --env-file .env -p 5000:5000 smartattendance-api
```

La base de datos PostgreSQL suele ejecutarse en otro contenedor o servicio gestionado; el contenedor de la API debe poder resolver `DB_HOST`.

---

## Flujos principales

1. **Registro**: el usuario elige rol, completa el formulario; la app llama al endpoint de registro y puede iniciar sesión automáticamente según la implementación.
2. **Login**: correo, contraseña y rol → API valida con bcrypt y devuelve JWT.
3. **Profesor**: crea clases, vincula estudiantes, genera QR de clase, marca manual o exporta reportes.
4. **Estudiante**: escanea QR válido; el servidor valida vigencia, pertenencia a clase y reglas de negocio; guarda fila en `asistencias`.
5. **Historial estudiante**: `GET` autenticado devuelve lista ordenada para la UI.

---

## Seguridad y validación

- Contraseñas almacenadas con **hash** (bcrypt) en servidor.
- Rutas protegidas con **JWT** (`Authorization: Bearer <token>`).
- El QR de sesión incluye datos firmados en el tiempo (expiración); el backend valida coherencia con la clase y la ventana temporal al registrar asistencia.
- La app no debe embeber secretos JWT: solo el backend conoce `JWT_SECRET`.

---

## Solución de problemas

| Síntoma | Qué revisar |
|---------|-------------|
| `Error conectando con el servidor` | Backend arriba, firewall, URL en `EXPO_PUBLIC_API_URL`, que el puerto coincida con `PORT`. |
| Login falla siempre | Base creada con `init.sql`, usuarios existentes, `JWT_SECRET` y `JWT_EXPIRES_IN` definidos. |
| Desde teléfono no llega al API | Usar IP LAN del PC, no `localhost`; CORS está habilitado en Express para desarrollo típico. |
| Healthcheck Docker falla | `PORT` dentro del contenedor debe ser **5000** o ajustar `Dockerfile` / variable de entorno para que coincidan puerto y healthcheck. |

---

## Estado del proyecto

- **Cliente**: Expo / React Native con flujos de profesor y estudiante.
- **Servidor**: API REST con PostgreSQL y JWT.
- **Documentación**: este README describe el despliegue local típico; adapta URLs y secretos para entornos reales.

**Última actualización del documento:** mayo de 2026.
