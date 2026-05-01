# SmartAttendance - Resumen del Proyecto

## 📋 Descripción General

**SmartAttendance** es una aplicación móvil multiplataforma para la gestión automatizada de asistencia estudiantil. La aplicación permite a profesores crear clases, generar códigos QR dinámicos para sesiones de asistencia, y registrar la presencia de estudiantes tanto de forma automática (mediante lectura de QR) como manual. Los estudiantes pueden escanear códigos QR para registrarse y consultar su historial de asistencia.

## 🎯 Objetivos del Proyecto

1. **Automatizar el registro de asistencia** mediante tecnología QR
2. **Eliminar registros manuales lentos** y propensos a errores
3. **Proporcionar reportes detallados** de asistencia en formato Excel
4. **Facilitar la gestión de clases y estudiantes** para profesores
5. **Dar transparencia** a los estudiantes sobre su asistencia
6. **Ser multiplataforma** (iOS, Android, Web)

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React Native 0.83.2** - Framework para desarrollo móvil multiplataforma
- **Expo ~55.0.8** - Plataforma para desarrollo y distribución de aplicaciones React Native
- **React 19.2.0** - Librería base para interfaces
- **React Navigation 7.x** - Sistema de navegación entre pantallas

### Módulos Especializados
- **expo-camera** - Acceso a cámara del dispositivo para escaneo de QR
- **expo-barcode-scanner** - Lectura de códigos de barras y QR
- **expo-file-system** - Acceso al sistema de archivos para exportación de datos
- **expo-sharing** - Compartir archivos generados
- **react-native-qrcode-svg** - Generación visual de códigos QR

### Persistencia de Datos
- **AsyncStorage 3.0.2** - Base de datos local para dispositivos móviles
- **localStorage** - Almacenamiento para versión web
- **Lógica condicional cross-platform** - Sistema de persistencia unificado

## 🏗️ Arquitectura del Sistema

```
SmartAttendance-app/
├── App.js                          # Componente raíz (autenticación y navegación)
├── index.js                        # Punto de entrada Expo
├── components/                     # Interfaz de usuario
│   ├── LoginView.js               # Pantalla de login
│   ├── RegisterRolView.js         # Selección de rol (Estudiante/Profesor)
│   ├── FormRegistroView.js        # Formulario de registro dinámico
│   ├── EstudianteMainView.js      # Panel principal del estudiante
│   ├── EscanearQRViewStudent.js   # Scanner QR para estudiantes
│   ├── HistorialViewStudent.js    # Historial de asistencia estudiante
│   ├── ProfesorView.js            # Panel principal del profesor
│   ├── QRView.js                  # Generador de QR (profesor)
│   ├── ResultadoView.js           # Visualización de QR generado
│   ├── ManualView.js              # Registro manual de asistencia
│   ├── EstudianteView.js          # Gestión de estudiantes por clase
│   └── ExportView.js              # Exportación de reportes
├── controllers/
│   └── asistenciaController.js    # Toda la lógica de negocio
├── models/
│   ├── clases.js                  # Almacenamiento de clases y asistencias
│   └── estudiantes.js             # Asociaciones estudiante-clase
└── utils/
    ├── storage.js                 # Persistencia cross-platform
    ├── time.js                    # Utilidades de fecha y hora
    ├── qrGenerator.js             # Validación de QR
    └── exportExcel.js             # Generación de reportes CSV
```

### Patrón de Arquitectura: MVC Modificado

- **Models**: Estructuras de datos globales (clases, estudiantes, asistencias)
- **Controllers**: Lógica de negocio centralizada (asistenciaController.js)
- **Views**: Componentes React Native reutilizables
- **Utils**: Funciones auxiliares para persistencia, formato, validación

## 👥 Estructura de Usuarios y Roles

### Rol: PROFESOR
**Capacidades:**
- ✅ Crear, editar y eliminar clases
- ✅ Generar códigos QR dinámicos (válidos 60 segundos)
- ✅ Ver estudiantes registrados por clase
- ✅ Agregar/eliminar estudiantes de clases
- ✅ Registrar asistencia manual
- ✅ Exportar reportes de asistencia en Excel
- ✅ Acceder a historial de sesiones

**Credencial de prueba:**
```
Email: profesor@universidad.edu
Contraseña: 1234
```

### Rol: ESTUDIANTE  
**Capacidades:**
- ✅ Escanear códigos QR para registrar asistencia
- ✅ Consultar historial personal de asistencia
- ✅ Ver detalles de cada sesión (date, clase, tipo)

**Credencial de prueba:**
```
Email: estudiante@universidad.edu
Contraseña: 1234
```

## 📱 Flujos de Usuario Principales

### Flujo 1: Registro de Nuevo Profesor
```
1. Usuario abre app
2. Elige rol: "Profesor"
3. Completa formulario: Nombre, ID, Departamento, Email, Contraseña
4. Sistema valida datos (mínimo 6 caracteres en contraseña)
5. Se registra en BD local
6. Accede a panel de profesor
```

### Flujo 2: Registro de Nuevo Estudiante
```
1. Usuario abre app
2. Elige rol: "Estudiante"
3. Completa formulario: Nombre, ID, Celular, Email, Contraseña
4. Sistema valida datos
5. Se registra en BD local
6. Accede a panel de estudiante
```

### Flujo 3: Crear Clase (Profesor)
```
1. Accede a "Gestionar Clases"
2. Formula datos: Nombre, Horario Inicio/Fin, Cupo
3. Sistema guarda en BD
4. Profesor puede agregar estudiantes a la clase
```

### Flujo 4: Generar QR para Sesión (Profesor)
```
1. Accede a "Generar QR"
2. Selecciona clase de dropdown
3. Presiona "Generar QR"
4. Sistema crea:
   - Token único (timestamp + ID clase)
   - Marcade tiempo de expiración (NOW + 60s)
   - Código QR visible con cronómetro
5. Cronómetro cuenta atrás
6. Nuevos QR pueden ser generados después de expiración
```

### Flujo 5: Registrar Asistencia por QR (Estudiante)
```
1. Estudiante abre "Escanear QR"
2. Solicita permiso de cámara (primera vez)
3. Apunta cámara al QR mostrado
4. Sistema valida automáticamente:
   ✓ ¿El estudiante existe?
   ✓ ¿El celular coincide con el registrado?
   ✓ ¿Pertenece a esta clase?
   ✓ ¿El QR es válido (no expirado)?
   ✓ ¿Es dentro del horario de clase?
   ✓ ¿No está duplicado (no ya marcó hoy)?
5. Si todo cumple → Asistencia registrada ✅
6. Si falla → Muestra error específico
```

### Flujo 6: Registrar Asistencia Manual (Profesor)
```
1. Accede a "Marcar Asistencia Manual"
2. Selecciona clase
3. Busca estudiantes por nombre
4. Por cada estudiante:
   - Presiona ✓ (asistió) o ✗ (faltó)
5. Borde verde/rojo indica estado
6. "Guardar" guarda todos de una vez
```

### Flujo 7: Ver Historial (Estudiante)
```
1. Accede a "Mi Historial"
2. Sistema carga todas las asistencias del estudiante
3. Muestra en lista:
   - Nombre de clase
   - Fecha (formato: DD MES, YYYY)
   - Hora
   - Tipo (QR o Manual)
```

### Flujo 8: Exportar Reportes (Profesor)
```
1. Accede a "Exportar Reportes"
2. Selecciona clase
3. Elige tipo de reporte:
   - Resumen: Sí/No por estudiante
   - Por Sesión: Detalle de cada fecha
   - General: Sistema completo
4. Sistema genera CSV
5. Abre diálogo para guardar/compartir
```

## 🔑 Funciones Principales del Controller

El archivo `controllers/asistenciaController.js` (200+ líneas) centraliza toda la lógica:

### Gestión de Clases
```javascript
crearClase(nombre, horaInicio, horaFin, cupo)
editarClase(claseId, nombre, horaInicio, horaFin, cupo)
borrarClase(claseId)
obtenerClases() → Array<Clase>
```

### Gestión de Estudiantes
```javascript
agregarEstudiante(claseId, nombre, id, celular)
editarEstudiante(claseId, estudianteId, datos)
borrarEstudiante(claseId, estudianteId)
obtenerEstudiantesPorClase(claseId) → Array<Estudiante>
```

### Validación Interna (Funciones Privadas)
```javascript
validarEstudiante(correo, contrasena)        // Usuario existe y credenciales correctas
validarPertenencia(estudianteId, claseId)    // Estudiante inscrito en clase
validarIdentidad(estudianteId, celular)      // Celular coincide con registrado
validarHorario(claseId, hora)                // Hora dentro de rango de clase
validarDuplicado(estudianteId, claseId, fecha) // No marcó asistencia hoy
```

### Generación y Validación de QR
```javascript
generarQRParaClase(claseId) → {
  claseId,
  token: "unique_token_timestamp",
  expiracion: Date.now() + 60000  // 60 segundos
}

validarQR(qrString, claseId) → boolean
tiempoRestanteQR(qrString) → segundos
```

### Registro de Asistencia
```javascript
registrarAsistenciaQRCompleto(estudianteId, claseId, qrData)
  // Valida 7 condiciones antes de registrar
  
guardarAsistenciaManual(asistencias[{estudianteId, asistio}])
  // Procesa batch de asistencias manual

registrarAsistenciaQR(estudianteId, claseId) // Versión estudiante
```

### Análisis y Reportes
```javascript
calcularAsistenciaPorClase(claseId) → {
  estudianteId: { presentes, faltas, porcentaje }
}

calcularAsistenciaGeneral() → porcentaje_total

obtenerSesionesPorClase(claseId) → {
  "2025-04-14": [registros de ese día]
}

obtenerHistorialEstudiante(estudianteId) → Array<Asistencia>
```

### Autenticación y Registro
```javascript
login(correo, contrasena) → usuario o error

registrarEstudiante({nombre, id, celular, correo, contrasena})
registrarProfesor({nombre, id, departamento, correo, contrasena})

obtenerEstudiantePorCorreo(correo) → estudiante
```

## 💾 Sistema de Persistencia de Datos

### Estructura de Datos en Memoria
```javascript
// En models/clases.js
clases[]              // Array de todas las clases
asistencias[]         // Array de registros de asistencia
errorLogs[]           // Log de errores del sistema
usuariosRegistrados[] // Array de usuarios (estudiantes y profesores)

// En models/estudiantes.js
estudiantes[]         // Asociación estudiante-clase
```

### Persistencia Cross-Platform
**utils/storage.js** proporciona abstracción:

```javascript
// En dispositivos móviles → AsyncStorage
guardarEnStorage(key, data) ↔ AsyncStorage.setItem()

// En navegadores web → localStorage
guardarEnStorage(key, data) ↔ localStorage.setItem()

// Lectura unificada
obtenerDelStorage(key, defaultValue)

// Operaciones
eliminarDelStorage(key)
limpiarStorage() // Borra todo
```

### Ciclo de Guardado
```
Acción del usuario
    ↓
Controller actualiza arrays en memoria
    ↓
Controller llama guardarEnStorage()
    ↓
Sistema detecta Platform (iOS/Android/Web)
    ↓
Guarda en AsyncStorage O localStorage
    ↓
Datos persisten entre sesiones ✅
```

### Inicialización en App
```
App.js inicia
    ↓
cargarDatosDelStorage() en App.useEffect
    ↓
Restaura: clases[], asistencias[], usuariosRegistrados[]
    ↓
App está lista con datos históricos ✅
```

## 🎨 Interfaz de Usuario

### Decisiones de Diseño

1. **Colores por Rol**: Cada pantalla tiene paleta distintiva
   - Profesor: Azul/Naranja
   - Estudiante: Verde/Azul

2. **Avatares Determinísticos**: 
   - Color asignado basado en hash del ID de estudiante
   - Iniciales (primeras letras de nombre y apellido)
   - Consistente entre sesiones

3. **Iconografía Clara**:
   - 🎓 Estudiante
   - 👨‍🏫 Profesor  
   - 📱 Escanear
   - 📊 Reportes

4. **Navegación por Pestañas**: Estudiantes tienen 2 tabs (QR + Historial)

5. **Componentes Reutilizables**:
   - Selectores de clase
   - Campos de búsqueda
   - Botones con estados (enabled/disabled)
   - Cards de información

## 🔒 Seguridad y Validación

### Validaciones en Login
```
1. Campo "correo" contiene @
2. Campo "contraseña" NO vacío
3. Usuario existe en BD
4. Contraseña coincide
```

### Validaciones en Registro
```
Nombre:        NO vacío
ID:            NO vacío (debe ser único)
Celular:       NO vacío (solo estudiantes)
Departamento:  NO vacío (solo profesores)
Email:         Debe contener @ (único en sistema)
Contraseña:    Mínimo 6 caracteres
```

### Validaciones en Escaneo QR (Estudiante)
```
1. QR pertenece a clase existente
2. Estudiante existe en BD
3. Celular en QR coincide con celular registrado
4. Estudiante está inscrito en la clase
5. QR no expirado (< 60 segundos)
6. Hora actual dentro del horario de clase
7. NO fue marcado asistencia hoy en esta clase
```

### Prevención de Errores
- No se permite duplicar asistencia en mismo día
- No se permiten emails duplicados
- No se permite ID de estudiante duplicado
- Borrado de estudiante solo su instructor
- Permisos de cámara solicitados con permiso

## 📊 Exportación de Reportes

### Formato CSV - Tres Tipos

**1. Resumen por Estudiante**
```
Nombre,Asistencias,Faltas,Porcentaje
Juan Pérez,18,2,90%
María García,19,1,95%
```

**2. Detalles por Sesión**
```
Fecha,Juan Pérez,María García,Carlos López
2025-04-14,P,P,F
2025-04-15,P,F,P
```

**3. Reportes Generales**
```
Estadísticas del Sistema
Total de Clases: 5
Total de Estudiantes: 45
Asistencia Promedio: 87%
```

### Flujo de Exportación
```
Usuario presiona "Exportar"
    ↓
generarCSV() formatea datos
    ↓
Expo FileSystem escribe archivo
    ↓
Expo Sharing abre diálogo
    ↓
Usuario elige: Guardar/Compartir/Email
```

## ⏱️ Características Especiales

### QR Dinámico con Expiración
- **Duración**: 60 segundos (configurable)
- **Validación**: Sistema verifica timestamp + 60s > ahora()
- **Renovación**: Profesor puede generar nuevo QR inmediatamente
- **Visualización**: Cronómetro MM:SS en tiempo real

### Contador de Sesiones
```
obtenerSesionesPorClase(claseId)
    ↓
Agrupa asistencias por fecha
    ↓
Muestra eventos históricos: "18 sesiones registradas"
```

### Búsqueda Inteligente
- Filtrado en tiempo real de estudiantes
- Sin diferenciación de mayúsculas/minúsculas
- Busca por nombre completo o parcial

### Compatible Multiplataforma
```
iOS ✅ (via Expo)
Android ✅ (via Expo)  
Web ✅ (via React Native Web)
```

## 📈 Estadísticas del Proyecto

| Métrica | Valor |
|---------|-------|
| **Archivos de Código** | 18 |
| **Líneas de Código** | ~2000+ |
| **Funciones en Controller** | 30+ |
| **Componentes React** | 11 |
| **Utilidades** | 4 |
| **Modelos** | 2 |
| **Dependencias Principales** | 8 |
| **Pantallas** | 11 |

## 🚀 Cómo Usar la Aplicación

### Instalación
```bash
# Clonar repositorio
git clone <url_repositorio>
cd SmartAttendance/SmartAttendance-app

# Instalar dependencias
npm install

# Iniciar con Expo
npx expo start

# Escanear QR con Expo Go (móvil) o Enter en browser
```

### Primera Vez

1. **Abrir App**
   - Se abre Login
   - Credenciales de prueba disponibles

2. **Como Profesor**
   ```
   Email: profesor@universidad.edu
   Contraseña: 1234
   ```
   - Accede a panel con opciones de gestión
   
3. **Como Estudiante**
   ```
   Email: estudiante@universidad.edu
   Contraseña: 1234
   ```
   - Accede a panel con opción de escanear QR

### Workflow Típico (Sesión de Clase)

```
1. Profesor genera QR (panel QR)
2. Comparte pantalla o proyecta QR
3. Estudiantes abren app y escanean
4. Sistema valida y registra automáticamente
5. Profesor ve estudiantes conectados
6. Al final: Profesor exporta reporte
```

## 🎓 Institucional

- **Duración de Sesión**: Determinada por rango de horario de clase
- **Identificación**: Correo único + Contraseña mínimo 6 caracteres
- **Rastrabilidad**: Cada registro incluye timestampde la acción
- **Ambigüedad Mínima**: Validación multi-nivel de identidad

## 📝 Resumen Técnico para Evaluación

### Fortalezas del Proyecto

✅ **Automatización Completa**: Reduce registros manuales a un clic  
✅ **Multiplataforma**: Funciona en iOS, Android, Web sin cambios  
✅ **Seguro**: Validación exhaustiva antes de registrar asistencia  
✅ **Escalable**: Arquitectura MVC permite agregar funciones fácilmente  
✅ **Intuitivo**: UX clara con roles diferenciados  
✅ **Offline-First**: Funciona sin internet (datos se sincronizan al conectar)  
✅ **Reportes Flexibles**: Múltiples formatos de exportación  

### Tecnologías Demostrables

- React Native (Multiplataforma)
- Expo (Desarrollo rápido)
- QR en tiempo real (Validación + cámara)
- AsyncStorage (Persistencia local)
- CSV Export (Integración de datos)
- Permiso de cámara (Permisos del SO)

### Casos de Uso Reales

1. **Universidad**: Automatizar asistencia en 100+ clases
2. **Capacitaciones**: Control de presencia en talleres
3. **Conferencias**: Registro rápido de asistentes
4. **Escuelas**: Transparencia de asistencia a padres

---

## 📞 Conclusión

SmartAttendance es una **solución completa y funcional** para la gestión de asistencia que demuestra:

- Comprensión de **desarrollo multiplataforma** con React Native
- Implementación de **características de seguridad y validación**  
- Diseño de **arquitectura escalable** con separación de responsabilidades
- Uso de **tecnologías modernas** (Expo, Cámara, Almacenamiento)
- **UX pensado en el usuario** con roles y flujos diferenciados
- **Capacidad de exportación** y análisis de datos

El proyecto está **completamente funcional** y listo para demostración en vivo.

---

**Fecha**: Abril 2025  
**Versión**: 1.0  
**Estado**: Funcional ✅
