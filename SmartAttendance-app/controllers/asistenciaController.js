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

// ─────────────────────────────────────────
// CLASES
// ─────────────────────────────────────────

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

  const claseId =
    id ||
    nombre.replace(/\s+/g, "").toUpperCase().substring(0, 8) +
      Date.now().toString(36).toUpperCase();

  const existe = clases.find((c) => c.id === claseId);
  if (existe) {
    return { ok: false, mensaje: "Ya existe una clase con ese ID." };
  }

  clases.push({ id: claseId, nombre, horaInicio, horaFin });
  // Guardar en persistencia
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

// ─────────────────────────────────────────
// ESTUDIANTES
// ─────────────────────────────────────────

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

// ─────────────────────────────────────────
// VALIDACIONES INTERNAS
// ─────────────────────────────────────────

function validarEstudiante(estudianteId) {
  return estudiantes.find((e) => e.id === estudianteId) || null;
}

function validarPertenencia(estudiante, claseId) {
  return estudiante.clases.includes(claseId);
}

function validarIdentidad(estudiante, celular) {
  return estudiante.celular === celular;
}

function validarHorario(clase) {
  const ahora = getCurrentTime();
  return ahora >= clase.horaInicio && ahora <= clase.horaFin;
}

function validarDuplicado(estudianteId, claseId) {
  const fecha = getCurrentDate();
  return asistencias.find(
    (a) =>
      a.estudianteId === estudianteId &&
      a.claseId === claseId &&
      a.fecha === fecha,
  );
}

function registrarError(estudianteId, claseId, motivo) {
  errorLogs.push({
    estudianteId,
    claseId,
    motivo,
    fecha: getCurrentDate(),
    hora: getCurrentTime(),
  });
}

// ─────────────────────────────────────────
// QR DINÁMICO
// ─────────────────────────────────────────

// Generar un QR para una clase con duración configurable en segundos
// El QR contiene: claseId, token único y timestamp de expiración
export function generarQRParaClase(claseId, duracionSegundos = 60) {
  const clase = clases.find((c) => c.id === claseId);
  if (!clase) return { ok: false, mensaje: "Clase no encontrada." };

  // Crear el objeto QR con token aleatorio y tiempo de expiración
  const qrData = {
    claseId,
    token: Math.random().toString(36).substring(2) + Date.now().toString(36),
    expiracion: Date.now() + duracionSegundos * 1000,
  };

  // Retornar el QR como string JSON para ser convertido en imagen QR
  return { ok: true, qr: JSON.stringify(qrData) };
}

// ─────────────────────────────────────────
// REGISTRO DE ASISTENCIA POR QR
// ─────────────────────────────────────────

export function registrarAsistenciaQRCompleto({ estudianteId, celular, claseId, qrData }) {
  // Validar existencia del estudiante
  const estudiante = validarEstudiante(estudianteId);
  if (!estudiante) {
    registrarError(estudianteId, claseId, "Estudiante no encontrado");
    return { ok: false, mensaje: "Estudiante no encontrado." };
  }

  // Validar identidad del estudiante
  if (!validarIdentidad(estudiante, celular)) {
    registrarError(estudianteId, claseId, "Identidad no coincide");
    return { ok: false, mensaje: "El celular no coincide con el registrado." };
  }

  // Validar que el estudiante pertenezca a la clase
  if (!validarPertenencia(estudiante, claseId)) {
    registrarError(estudianteId, claseId, "No pertenece a la clase");
    return { ok: false, mensaje: "No estás inscrito en esta clase." };
  }

  // Validar QR
  try {
    const qr = JSON.parse(qrData);
    const ahora = Date.now();

    // Validar que el QR corresponda a la clase
    if (qr.claseId !== claseId) {
      registrarError(estudianteId, claseId, "QR de otra clase");
      return { ok: false, mensaje: "El QR no corresponde a esta clase." };
    }
    // Validar que el QR no haya expirado
    if (ahora > qr.expiracion) {
      registrarError(estudianteId, claseId, "QR expirado");
      return { ok: false, mensaje: "El QR ha expirado. Solicita uno nuevo." };
    }
    // Si el QR es válido, continuar con las demás validaciones
  } catch {
    registrarError(estudianteId, claseId, "QR inválido");
    return { ok: false, mensaje: "QR inválido o modificado." };
  }

  // Validar que la clase exista
  const clase = clases.find((c) => c.id === claseId);
  if (!clase) {
    return { ok: false, mensaje: "Clase no encontrada." };
  }

  // Validar que el registro se haga dentro del horario de la clase
  if (!validarHorario(clase)) {
    registrarError(estudianteId, claseId, "Fuera de horario");
    return { ok: false, mensaje: "Estás fuera del horario permitido." };
  }

  // Validar que no haya un registro previo para el mismo estudiante, clase y fecha
  if (validarDuplicado(estudianteId, claseId)) {
    registrarError(estudianteId, claseId, "Registro duplicado");
    return { ok: false, mensaje: "Ya registraste asistencia hoy en esta clase." };
  }

  // Si todas las validaciones pasan, registrar la asistencia
  asistencias.push({
    estudianteId,
    claseId,
    fecha: getCurrentDate(),
    hora: getCurrentTime(),
    tipo: "qr",
  });

  // Guardar en persistencia
  guardarAsistenciasEnStorage();

  // Retornar mensaje de éxito con el nombre del estudiante
  return {
    ok: true,
    mensaje: `¡Asistencia registrada! Bienvenido ${estudiante.nombre}.`,
  };
}

// ─────────────────────────────────────────
// ASISTENCIA MANUAL
// ─────────────────────────────────────────

// Registro de asistencia manual por el profesor en lote
// registros: [ { estudianteId, asistio: true/false }, ... ]
// Validaciones: clase existe, no duplicado por cada estudiante
export function guardarAsistenciaManual({ claseId, registros }) {
  // Validar que la clase exista
  const clase = clases.find((c) => c.id === claseId);
  if (!clase) return { ok: false, mensaje: "Clase no encontrada." };

  let guardados = 0;

  // Recorrer cada registro y guardar solo los que asistieron
  for (const r of registros) {
    if (!r.asistio) continue; // omitir los que no asistieron

    // Validar que no haya un registro previo para el mismo estudiante, clase y fecha
    const duplicado = validarDuplicado(r.estudianteId, claseId);
    if (duplicado) continue;

    // Si todas las validaciones pasan, registrar la asistencia manual
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

  // Retornar mensaje de éxito con el total de asistencias guardadas
  return { ok: true, mensaje: `${guardados} asistencia(s) guardada(s).` };
}

// ─────────────────────────────────────────
// CÁLCULO Y EXPORTACIÓN
// ─────────────────────────────────────────

// ✅ CORREGIDO: ahora usamos sesiones reales en lugar de clases.length
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
      totalClases: totalSesiones, // 👈 ahora refleja sesiones reales
      porcentaje,
    };
  });
}

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
      totalClases: totalSesiones, // 👈 sesiones reales
      porcentaje,
    };
  });
}

// ─────────────────────────────────────────
// Sesiones
// ─────────────────────────────────────────

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

// ─────────────────────────────────────────
// REGISTRO DE USUARIOS
// ─────────────────────────────────────────

export function registrarEstudiante({ nombre, id, celular, correo, contrasena }) {
  // Validar que no exista correo duplicado
  const correoExiste = usuariosRegistrados.estudiantes.some((e) => e.correo === correo);
  if (correoExiste) {
    return { ok: false, mensaje: "El correo ya está registrado." };
  }

  // Validar que no exista ID duplicado
  const idExiste = usuariosRegistrados.estudiantes.some((e) => e.id === id);
  if (idExiste) {
    return { ok: false, mensaje: "El ID de estudiante ya está registrado." };
  }

  // Agregar nuevo estudiante
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

export function registrarProfesor({ nombre, id, departamento, correo, contrasena }) {
  // Validar que no exista correo duplicado
  const correoExiste = usuariosRegistrados.profesores.some((p) => p.correo === correo);
  if (correoExiste) {
    return { ok: false, mensaje: "El correo ya está registrado." };
  }

  // Validar que no exista ID duplicado
  const idExiste = usuariosRegistrados.profesores.some((p) => p.id === id);
  if (idExiste) {
    return { ok: false, mensaje: "El ID de profesor ya está registrado." };
  }

  // Agregar nuevo profesor
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

// ─────────────────────────────────────────
// AUTENTICACIÓN (Simulada para pruebas)
// ─────────────────────────────────────────

export function login({ correo, contrasena, rol }) {
  if (!rol || (rol !== "profesor" && rol !== "estudiante")) {
    return { ok: false, mensaje: "Rol no válido." };
  }

  const usuarios = rol === "profesor" ? usuariosRegistrados.profesores : usuariosRegistrados.estudiantes;

  // Buscar usuario por correo
  const usuario = usuarios.find((u) => u.correo === correo);

  if (!usuario) {
    return { ok: false, mensaje: "Correo no encontrado." };
  }

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

// ─────────────────────────────────────────
// FUNCIONES PARA ESTUDIANTES
// ─────────────────────────────────────────

export function obtenerEstudiantePorCorreo(correo) {
  // Buscar en estudiantes registrados
  return usuariosRegistrados.estudiantes.find((e) => e.correo === correo) || null;
}

export function registrarAsistenciaQR({ estudianteId, celular, claseId, qrData }) {
  // Validar que el estudiante exista
  const estudiante = usuariosRegistrados.estudiantes.find((e) => e.id === estudianteId);
  if (!estudiante) {
    return { ok: false, mensaje: "Estudiante no encontrado." };
  }

  // Validar celular
  if (estudiante.celular !== celular) {
    return { ok: false, mensaje: "El número de celular no coincide." };
  }

  // Validar que la clase exista
  const clase = clases.find((c) => c.id === claseId);
  if (!clase) {
    return { ok: false, mensaje: "La clase no existe." };
  }

  // Validar que no haya duplicado en el mismo día
  const fecha = getCurrentDate();
  const yaAsistio = asistencias.find(
    (a) => a.estudianteId === estudianteId && 
           a.claseId === claseId && 
           a.fecha === fecha
  );
  if (yaAsistio) {
    return { ok: false, mensaje: "Ya registraste asistencia hoy en esta clase." };
  }

  // Registrar asistencia
  asistencias.push({
    estudianteId,
    claseId,
    fecha,
    hora: getCurrentTime(),
    tipo: "qr",
  });

  // Guardar en persistencia
  guardarAsistenciasEnStorage();

  return { ok: true, mensaje: "✓ Asistencia registrada correctamente." };
}

export function obtenerHistorialEstudiante(estudianteId) {
  // Obtener todas las asistencias del estudiante
  const asistenciasEstudiante = asistencias.filter(
    (a) => a.estudianteId === estudianteId
  );

  // Enriquecer con información de la clase
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
