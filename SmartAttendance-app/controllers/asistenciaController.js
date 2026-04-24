// asistenciaController.js - Controlador principal para manejar la lógica de clases, estudiantes y asistencias
import { estudiantes } from "../models/estudiantes";
import { 
  clases, 
  asistencias, 
  errorLogs, 
  usuariosRegistrados,
  guardarAsistenciasEnStorage, 
  guardarClasesEnStorage,
  guardarEstudiantesEnStorage,
  guardarUsuariosEnStorage
} from "../models/clases";
import { getCurrentTime, getCurrentDate } from "../utils/time";

// Este controlador maneja toda la lógica de negocio para clases, estudiantes y asistencias
// Aquí ocurren todas las validaciones y registros importantes del sistema

// CRUD básico para clases - permitir crear, editar, eliminr y consultar clases
export function crearClase({ id, nombre, horaInicio, horaFin }) {
  if (!nombre || nombre.trim() === "") {
    return {
      ok: false,
      mensaje: "El nombre de la clase no puede estar vacío.",
    };
  }
  if (!horaInicio || !horaFin) {
    return { ok: false, mensaje: "Debes ingresar hora de inicio y fin." };
  }
  if (horaInicio >= horaFin) {
    return {
      ok: false,
      mensaje: "La hora de inicio debe ser menor a la hora de fin.",
    };
  }

  // Si el profesor no proporciona un ID, generamos uno automáticamente basado en el nombre
  const claseId =
    id ||
    nombre.replace(/\s+/g, "").toUpperCase().substring(0, 8) +
      Date.now().toString(36).toUpperCase();

  const existe = clases.find((c) => c.id === claseId);
  if (existe) {
    return { ok: false, mensaje: "Ya existe una clase con ese ID." };
  }

  clases.push({ id: claseId, nombre, horaInicio, horaFin });
  // Guardamos la clase en almacenamiento persistente para no perder datos
  guardarClasesEnStorage();
  return { ok: true, mensaje: "Clase creada exitosamente.", claseId };
}

export function editarClase({ id, nombre, horaInicio, horaFin }) {
  const clase = clases.find((c) => c.id === id);
  if (!clase) return { ok: false, mensaje: "Clase no encontrada." };

  if (horaInicio && horaFin && horaInicio >= horaFin) {
    return {
      ok: false,
      mensaje: "La hora de inicio debe ser menor a la hora de fin.",
    };
  }

  if (nombre) clase.nombre = nombre;
  if (horaInicio) clase.horaInicio = horaInicio;
  if (horaFin) clase.horaFin = horaFin;

  return { ok: true, mensaje: "Clase actualizada correctamente." };
}

export function borrarClase(id) {
  const index = clases.findIndex((c) => c.id === id);
  if (index === -1) return { ok: false, mensaje: "Clase no encontrada." };

  clases.splice(index, 1);
  return { ok: true, mensaje: "Clase eliminada." };
}

export function obtenerClases() {
  return clases;
}

// CRUD para estudiantes - agregar estudiantes a clases, editarlos y eliminarlos
export function agregarEstudiante({ id, nombre, celular, claseId }) {
  if (!id || !nombre || !celular || !claseId) {
    return { ok: false, mensaje: "Todos los campos son obligatorios." };
  }

  const claseExiste = clases.find((c) => c.id === claseId);
  if (!claseExiste) {
    return { ok: false, mensaje: "La clase seleccionada no existe." };
  }

  const existe = estudiantes.find((e) => e.id === id);
  if (existe) {
    // Si el estudiante ya existe, podemos vincularlo a una nueva clase
    if (!existe.clases.includes(claseId)) {
      existe.clases.push(claseId);
      guardarEstudiantesEnStorage();
      return { ok: true, mensaje: `${existe.nombre} vinculado a la clase.` };
    }
    return {
      ok: false,
      mensaje: "El estudiante ya está vinculado a esta clase.",
    };
  }

  // Crear un nuevo estudiante y vincularlo a la clase
  estudiantes.push({ id, nombre, celular, clases: [claseId] });
  guardarEstudiantesEnStorage();
  return { ok: true, mensaje: `Estudiante ${nombre} creado y vinculado.` };
}

export function editarEstudiante({ id, nombre, celular }) {
  const est = estudiantes.find((e) => e.id === id);
  if (!est) return { ok: false, mensaje: "Estudiante no encontrado." };

  if (nombre) est.nombre = nombre;
  if (celular) est.celular = celular;

  return { ok: true, mensaje: "Estudiante actualizado correctamente." };
}

export function borrarEstudiante(id) {
  const index = estudiantes.findIndex((e) => e.id === id);
  if (index === -1) return { ok: false, mensaje: "Estudiante no encontrado." };

  estudiantes.splice(index, 1);
  return { ok: true, mensaje: "Estudiante eliminado." };
}

export function obtenerEstudiantesPorClase(claseId) {
  return estudiantes.filter((e) => e.clases.includes(claseId));
}

export function obtenerTodosEstudiantes() {
  return estudiantes;
}

// Funciones internas de validación - usadas en el flujo de registro de asistencia
// Verificamos que el estudiante exista, que pertenezca a la clase, que el celular sea correcto, etc.
function validarEstudiante(estudianteId) {
  return estudiantes.find((e) => e.id === estudianteId) || null;
}

function validarPertenencia(estudiante, claseId) {
  return estudiante.clases.includes(claseId);
}

// Validar que el celular que proporcionó coincida con el del registro
function validarIdentidad(estudiante, celular) {
  return estudiante.celular === celular;
}

// Verificar si el estudiante intenta registrar asistencia dentro del horario de la clase
function validarHorario(clase) {
  const ahora = getCurrentTime();
  return ahora >= clase.horaInicio && ahora <= clase.horaFin;
}

// Evitar que el mismo estudiante registe asistencia dos veces en la misma clase en el mismo día
function validarDuplicado(estudianteId, claseId) {
  const fecha = getCurrentDate();
  return asistencias.find(
    (a) =>
      a.estudianteId === estudianteId &&
      a.claseId === claseId &&
      a.fecha === fecha,
  );
}

// Si algo falla, registramos el error para poder analizarlo después
function registrarError(estudianteId, claseId, motivo) {
  errorLogs.push({
    estudianteId,
    claseId,
    motivo,
    fecha: getCurrentDate(),
    hora: getCurrentTime(),
  });
}

// Los QR se generan dinámicamente y expiran después de un cierto tiempo (60 segundos por defecto)
// Esto asegura que el mismo QR no pueda usarse en múltiples momentos
// El profesor genera un QR para cada sesión de clase
export function generarQRParaClase(claseId, duracionSegundos = 60) {
  const clase = clases.find((c) => c.id === claseId);
  if (!clase) return { ok: false, mensaje: "Clase no encontrada." };

  // Creamos un objeto QR con un token único y tiempo de expiración
  const qrData = {
    claseId,
    token: Math.random().toString(36).substring(2) + Date.now().toString(36),
    expiracion: Date.now() + duracionSegundos * 1000,
  };

  // Convertimos a JSON string para que se convierta en código QR
  return { ok: true, qr: JSON.stringify(qrData) };
}

// Cuando un estudiante escanea un QR, se ejecuta esta función que realiza múltiples validaciones
// Primero verifica que el estudiante existe, que pertenece a la clase, que el QR es válido, etc.
export function registrarAsistenciaQRCompleto({ estudianteId, celular, claseId, qrData }) {
  // Validar existencia del estudiante
  const estudiante = validarEstudiante(estudianteId);
  if (!estudiante) {
    registrarError(estudianteId, claseId, "Estudiante no encontrado");
    return { ok: false, mensaje: "Estudiante no encontrado." };
  }

  // Validar identidad del estudiante (que el celular coincida)
  if (!validarIdentidad(estudiante, celular)) {
    registrarError(estudianteId, claseId, "Identidad no coincide");
    return { ok: false, mensaje: "El celular no coincide con el registrado." };
  }

  // Validar que el estudiante pertenezca a la clase
  if (!validarPertenencia(estudiante, claseId)) {
    registrarError(estudianteId, claseId, "No pertenece a la clase");
    return { ok: false, mensaje: "No estás inscrito en esta clase." };
  }

  // Validar que el QR sea válido (no haya sido modificado, que sea de esta clase, etc.)
  try {
    const qr = JSON.parse(qrData);
    const ahora = Date.now();

    // El QR debe corresponder exactamente a esta clase
    if (qr.claseId !== claseId) {
      registrarError(estudianteId, claseId, "QR de otra clase");
      return { ok: false, mensaje: "El QR no corresponde a esta clase." };
    }
    // El QR tiene una duración limitada, después expira
    if (ahora > qr.expiracion) {
      registrarError(estudianteId, claseId, "QR expirado");
      return { ok: false, mensaje: "El QR ha expirado. Solicita uno nuevo." };
    }
  } catch {
    registrarError(estudianteId, claseId, "QR inválido");
    return { ok: false, mensaje: "QR inválido o modificado." };
  }

  // Validar que la clase exista
  const clase = clases.find((c) => c.id === claseId);
  if (!clase) {
    return { ok: false, mensaje: "Clase no encontrada." };
  }

  // Validar que el registro se haga dentro del horario de la clase (no fuera de hora)
  if (!validarHorario(clase)) {
    registrarError(estudianteId, claseId, "Fuera de horario");
    return { ok: false, mensaje: "Estás fuera del horario permitido." };
  }

  // Validar que el estudiante no haya registrado asistencia ya hoy en esta clase
  if (validarDuplicado(estudianteId, claseId)) {
    registrarError(estudianteId, claseId, "Registro duplicado");
    return { ok: false, mensaje: "Ya registraste asistencia hoy en esta clase." };
  }

  // Todas las validaciones pasaron, registrar la asistencia
  asistencias.push({
    estudianteId,
    claseId,
    fecha: getCurrentDate(),
    hora: getCurrentTime(),
    tipo: "qr",
  });

  // Guardar en almacenamiento persistente
  guardarAsistenciasEnStorage();

  return {
    ok: true,
    mensaje: `¡Asistencia registrada! Bienvenido ${estudiante.nombre}.`,
  };
}

// Los profesores pueden registrar asistencia de forma manual sin QR
// Útil para casos donde falla el escaneo o hay problemas técnicos
export function guardarAsistenciaManual({ claseId, registros }) {
  // Validar que la clase exista
  const clase = clases.find((c) => c.id === claseId);
  if (!clase) return { ok: false, mensaje: "Clase no encontrada." };

  let guardados = 0;

  // Recorrer cada registro y guardar solo a quienes asistieron
  for (const r of registros) {
    if (!r.asistio) continue; // Omitir a quienes no asistieron

    // Evitar duplicados - si ya está registrado hoy, no vuelvo a registrar
    const duplicado = validarDuplicado(r.estudianteId, claseId);
    if (duplicado) continue;

    // Registrar la asistencia manual
    asistencias.push({
      estudianteId: r.estudianteId,
      claseId,
      fecha: getCurrentDate(),
      hora: getCurrentTime(),
      tipo: "manual",
    });
    guardados++;
  }

  // Guardar en persistencia
  guardarAsistenciasEnStorage();

  return { ok: true, mensaje: `${guardados} asistencia(s) guardada(s).` };
}


// Cálculos de asistencia - importante para generar reportes y estadísticas
// Se calcula cuántas clases ha asistido cada estudiante vs cuántas fueron en total
export function calcularAsistenciaPorClase(claseId) {
  const estudiantesClase = obtenerEstudiantesPorClase(claseId);
  const sesiones = obtenerSesionesPorClase(claseId);
  const totalSesiones = sesiones.length;

  return estudiantesClase.map((est) => {
    const totalAsistencias = asistencias.filter(
      (a) => a.estudianteId === est.id && a.claseId === claseId,
    ).length;

    const porcentaje =
      totalSesiones > 0
        ? Math.round((totalAsistencias / totalSesiones) * 100)
        : 0;

    return {
      id: est.id,
      nombre: est.nombre,
      asistencias: totalAsistencias,
      totalClases: totalSesiones,
      porcentaje,
    };
  });
}

// Calcular asistencia general de cada estudiante en todas las clases
export function calcularAsistenciaGeneral() {
  const todasSesiones = obtenerTodasLasSesiones();
  const totalSesiones = todasSesiones.length;

  return estudiantes.map((est) => {
    const totalAsistencias = asistencias.filter(
      (a) => a.estudianteId === est.id,
    ).length;

    const porcentaje =
      totalSesiones > 0
        ? Math.round((totalAsistencias / totalSesiones) * 100)
        : 0;

    return {
      id: est.id,
      nombre: est.nombre,
      asistencias: totalAsistencias,
      totalClases: totalSesiones,
      porcentaje,
    };
  });
}

// Una sesión es cada día que se registró asistencia en una clase
// Esto nos permite calcular el porcentaje de asistencia correctamente
export function obtenerSesionesPorClase(claseId) {
  const porFecha = {};
  asistencias
    .filter((a) => a.claseId === claseId)
    .forEach((a) => {
      porFecha[a.fecha] = (porFecha[a.fecha] || 0) + 1;
    });

  return Object.entries(porFecha)
    .map(([fecha, total]) => ({ fecha, total }))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

// Obtener todas las sesiones de todas las clases
export function obtenerTodasLasSesiones() {
  const porFecha = {};
  asistencias.forEach((a) => {
    const key = `${a.claseId}_${a.fecha}`;
    if (!porFecha[key]) {
      porFecha[key] = { fecha: a.fecha, claseId: a.claseId, total: 0 };
    }
    porFecha[key].total += 1;
  });

  return Object.values(porFecha).sort((a, b) => b.fecha.localeCompare(a.fecha));
}

// Función para registrar un nuevo estudiante en el sistema
// Se validan correos e IDs duplicados
export function registrarEstudiante({ nombre, id, celular, correo, contrasena }) {
  // Verificar que el correo no esté ya registrado
  const correoExiste = usuariosRegistrados.estudiantes.some((e) => e.correo === correo);
  if (correoExiste) {
    return { ok: false, mensaje: "El correo ya está registrado." };
  }

  // Verificar que el ID no esté duplicado
  const idExiste = usuariosRegistrados.estudiantes.some((e) => e.id === id);
  if (idExiste) {
    return { ok: false, mensaje: "El ID de estudiante ya está registrado." };
  }

  // Crear el nuevo usuario estudiante
  usuariosRegistrados.estudiantes.push({
    id,
    nombre,
    correo,
    contrasena,
    celular,
  });
  
  guardarUsuariosEnStorage();

  return { ok: true, mensaje: "Estudiante registrado exitosamente." };
}

// Registro de un nuevo profesor en el sistema
export function registrarProfesor({ nombre, id, departamento, correo, contrasena }) {
  // Verificar que el correo no esté ya registrado
  const correoExiste = usuariosRegistrados.profesores.some((p) => p.correo === correo);
  if (correoExiste) {
    return { ok: false, mensaje: "El correo ya está registrado." };
  }

  // Verificar que el ID no esté duplicado
  const idExiste = usuariosRegistrados.profesores.some((p) => p.id === id);
  if (idExiste) {
    return { ok: false, mensaje: "El ID de profesor ya está registrado." };
  }

  // Crear el nuevo usuario profesor
  usuariosRegistrados.profesores.push({
    id,
    nombre,
    correo,
    contrasena,
    departamento,
  });
  
  guardarUsuariosEnStorage();

  return { ok: true, mensaje: "Profesor registrado exitosamente." };
}

// Login del sistema - verifica credenciales del usuario (profesor o estudiante)
// Aquí es donde el usuario inicia sesión con su correo y contraseña
export function login({ correo, contrasena, rol }) {
  if (!rol || (rol !== "profesor" && rol !== "estudiante")) {
    return { ok: false, mensaje: "Rol no válido." };
  }

  // Seleccionar la lista correcta según el rol
  const usuarios = rol === "profesor" ? usuariosRegistrados.profesores : usuariosRegistrados.estudiantes;

  // Buscar al usuario por correo
  const usuario = usuarios.find((u) => u.correo === correo);

  if (!usuario) {
    return { ok: false, mensaje: "Correo no encontrado." };
  }

  // Verificar la contraseña (en producción esto sería hasheado)
  if (usuario.contrasena !== contrasena) {
    return { ok: false, mensaje: "Contraseña incorrecta." };
  }

  return {
    ok: true,
    usuario: {
      correo: usuario.correo,
      rol,
      nombre: usuario.nombre,
      id: usuario.id,
    },
  };
}

// Funciones específicas para estudiantes logueados

// Encontrar un estudiante por su correo
export function obtenerEstudiantePorCorreo(correo) {
  return usuariosRegistrados.estudiantes.find((e) => e.correo === correo) || null;
}

// Los estudiantes pueden registrar asistencia escaneando un QR desde su celular
export function registrarAsistenciaQR({ estudianteId, celular, claseId, qrData }) {
  // Verificar que el estudiante exista en la base de datos
  const estudiante = usuariosRegistrados.estudiantes.find((e) => e.id === estudianteId);
  if (!estudiante) {
    return { ok: false, mensaje: "Estudiante no encontrado." };
  }

  // Verificar que el celular coincida con el registrado
  if (estudiante.celular !== celular) {
    return { ok: false, mensaje: "El número de celular no coincide." };
  }

  // Verificar que la clase exista
  const clase = clases.find((c) => c.id === claseId);
  if (!clase) {
    return { ok: false, mensaje: "La clase no existe." };
  }

  // Verificar que no haya registrado asistencia ya hoy en esta clase
  const fecha = getCurrentDate();
  const yaAsistio = asistencias.find(
    (a) => a.estudianteId === estudianteId && 
           a.claseId === claseId && 
           a.fecha === fecha
  );
  if (yaAsistio) {
    return { ok: false, mensaje: "Ya registraste asistencia hoy en esta clase." };
  }

  // Registrar la asistencia
  asistencias.push({
    estudianteId,
    claseId,
    fecha,
    hora: getCurrentTime(),
    tipo: "qr",
  });

  guardarAsistenciasEnStorage();

  return { ok: true, mensaje: "✓ Asistencia registrada correctamente." };
}

// Obtener el historial de asistencia de un estudiante (todas sus asistencias registradas)
export function obtenerHistorialEstudiante(estudianteId) {
  // Obtener todas las asistencias del estudiante
  const asistenciasEstudiante = asistencias.filter(
    (a) => a.estudianteId === estudianteId
  );

  // Agregar información de la clase (nombre) a cada asistencia
  return asistenciasEstudiante.map((a) => {
    const clase = clases.find((c) => c.id === a.claseId);
    return {
      claseId: a.claseId,
      claseNombre: clase?.nombre || "Clase desconocida",
      fecha: a.fecha,
      hora: a.hora,
      tipo: a.tipo,
    };
  }).sort((a, b) => b.fecha.localeCompare(a.fecha));
}
