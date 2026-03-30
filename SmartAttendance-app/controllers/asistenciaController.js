import { estudiantes } from "../models/estudiantes";
import { clases, asistencias, errorLogs } from "../models/clases";
import { getCurrentTime, getCurrentDate } from "../utils/time";

// ─────────────────────────────────────────
// CLASES
// ─────────────────────────────────────────

// Crear una nueva clase
// Validaciones: nombre no vacío, horaInicio < horaFin, ID único
export function crearClase({ id, nombre, horaInicio, horaFin }) {
  if (!nombre || nombre.trim() === "") {
    return { ok: false, mensaje: "El nombre de la clase no puede estar vacío." };
  }
  if (!horaInicio || !horaFin) {
    return { ok: false, mensaje: "Debes ingresar hora de inicio y fin." };
  }
  // Validar que la hora de inicio sea menor a la hora de fin
  if (horaInicio >= horaFin) {
    return { ok: false, mensaje: "La hora de inicio debe ser menor a la hora de fin." };
  }

  // Generar ID automático si no se proporciona
  const claseId = id || nombre.replace(/\s+/g, "").toUpperCase().substring(0, 8)
    + Date.now().toString(36).toUpperCase();

  // Validar que el ID sea único
  const existe = clases.find((c) => c.id === claseId);
  if (existe) {
    return { ok: false, mensaje: "Ya existe una clase con ese ID." };
  }

  // Si todo es válido, crear la clase
  clases.push({ id: claseId, nombre, horaInicio, horaFin });
  return { ok: true, mensaje: "Clase creada exitosamente.", claseId };
}

// Editar una clase existente
// Validaciones: clase existe, horaInicio < horaFin si se modifican
export function editarClase({ id, nombre, horaInicio, horaFin }) {
  const clase = clases.find((c) => c.id === id);
  if (!clase) return { ok: false, mensaje: "Clase no encontrada." };

  // Validar horario solo si se envían ambos campos
  if (horaInicio && horaFin && horaInicio >= horaFin) {
    return { ok: false, mensaje: "La hora de inicio debe ser menor a la hora de fin." };
  }

  // Actualizar solo los campos que se envíen
  if (nombre) clase.nombre = nombre;
  if (horaInicio) clase.horaInicio = horaInicio;
  if (horaFin) clase.horaFin = horaFin;

  return { ok: true, mensaje: "Clase actualizada correctamente." };
}

// Eliminar una clase por ID
export function borrarClase(id) {
  const index = clases.findIndex((c) => c.id === id);
  if (index === -1) return { ok: false, mensaje: "Clase no encontrada." };

  // Eliminar la clase del array
  clases.splice(index, 1);
  return { ok: true, mensaje: "Clase eliminada." };
}

// Retorna todas las clases creadas
export function obtenerClases() {
  return clases;
}

// ─────────────────────────────────────────
// ESTUDIANTES
// ─────────────────────────────────────────

// Agregar un estudiante y vincularlo a una clase
// Si el estudiante ya existe, solo lo vincula a la nueva clase
export function agregarEstudiante({ id, nombre, celular, claseId }) {
  if (!id || !nombre || !celular || !claseId) {
    return { ok: false, mensaje: "Todos los campos son obligatorios." };
  }

  // Validar que la clase exista antes de vincular
  const claseExiste = clases.find((c) => c.id === claseId);
  if (!claseExiste) {
    return { ok: false, mensaje: "La clase seleccionada no existe." };
  }

  const existe = estudiantes.find((e) => e.id === id);
  if (existe) {
    // Si ya existe, solo vincular a la nueva clase si no está ya inscrito
    if (!existe.clases.includes(claseId)) {
      existe.clases.push(claseId);
      return { ok: true, mensaje: `${existe.nombre} vinculado a la clase.` };
    }
    return { ok: false, mensaje: "El estudiante ya está vinculado a esta clase." };
  }

  // Si no existe, crear el estudiante y vincularlo a la clase
  estudiantes.push({ id, nombre, celular, clases: [claseId] });
  return { ok: true, mensaje: `Estudiante ${nombre} creado y vinculado.` };
}

// Editar nombre o celular de un estudiante existente
export function editarEstudiante({ id, nombre, celular }) {
  const est = estudiantes.find((e) => e.id === id);
  if (!est) return { ok: false, mensaje: "Estudiante no encontrado." };

  // Actualizar solo los campos que se envíen
  if (nombre) est.nombre = nombre;
  if (celular) est.celular = celular;

  return { ok: true, mensaje: "Estudiante actualizado correctamente." };
}

// Eliminar un estudiante por ID
export function borrarEstudiante(id) {
  const index = estudiantes.findIndex((e) => e.id === id);
  if (index === -1) return { ok: false, mensaje: "Estudiante no encontrado." };

  // Eliminar el estudiante del array
  estudiantes.splice(index, 1);
  return { ok: true, mensaje: "Estudiante eliminado." };
}

// Retorna solo los estudiantes vinculados a una clase específica
export function obtenerEstudiantesPorClase(claseId) {
  return estudiantes.filter((e) => e.clases.includes(claseId));
}

// Retorna todos los estudiantes registrados
export function obtenerTodosEstudiantes() {
  return estudiantes;
}

// ─────────────────────────────────────────
// VALIDACIONES INTERNAS
// ─────────────────────────────────────────

// Buscar un estudiante por ID, retorna null si no existe
function validarEstudiante(estudianteId) {
  return estudiantes.find((e) => e.id === estudianteId) || null;
}

// Validar que el estudiante esté inscrito en la clase
function validarPertenencia(estudiante, claseId) {
  return estudiante.clases.includes(claseId);
}

// Validar que el celular coincida con el registrado para ese estudiante
function validarIdentidad(estudiante, celular) {
  return estudiante.celular === celular;
}

// Validar que el registro se haga dentro del horario de la clase
function validarHorario(clase) {
  const ahora = getCurrentTime(); // formato "HH:mm" que devuelve la hora actual
  return ahora >= clase.horaInicio && ahora <= clase.horaFin;
}

// Validar que no haya un registro previo para el mismo estudiante, clase y fecha
function validarDuplicado(estudianteId, claseId) {
  const fecha = getCurrentDate();
  return asistencias.find(
    (a) =>
      a.estudianteId === estudianteId &&
      a.claseId === claseId &&
      a.fecha === fecha
  );
}

// Registrar un error en el log con el motivo específico
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

// Nuevo registro de asistencia por QR
// Validaciones: estudiante existe, pertenece a la clase, celular coincide,
// QR válido y vigente, dentro del horario, no duplicado
export function registrarAsistenciaQR({ estudianteId, celular, claseId, qrData }) {
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

  // Retornar mensaje de éxito con el total de asistencias guardadas
  return { ok: true, mensaje: `${guardados} asistencia(s) guardada(s).` };
}

// ─────────────────────────────────────────
// CÁLCULO Y EXPORTACIÓN
// ─────────────────────────────────────────

// Calcular el porcentaje de asistencia de cada estudiante en una clase específica
// Retorna un array con ID, nombre, asistencias, total clases y porcentaje
export function calcularAsistenciaPorClase(claseId) {
  const estudiantesClase = obtenerEstudiantesPorClase(claseId);
  const totalClases = clases.length;

  // Para cada estudiante, contar cuántas asistencias tiene y calcular el porcentaje
  return estudiantesClase.map((est) => {
    const totalAsistencias = asistencias.filter(
      (a) => a.estudianteId === est.id && a.claseId === claseId
    ).length;

    // Calcular el porcentaje de asistencia
    const porcentaje =
      totalClases > 0 ? Math.round((totalAsistencias / totalClases) * 100) : 0;

    // Retornar un objeto con el ID, nombre, total asistencias, total clases y porcentaje
    return {
      id: est.id,
      nombre: est.nombre,
      asistencias: totalAsistencias,
      totalClases,
      porcentaje,
    };
  });
}

// Calcular el porcentaje de asistencia general de todos los estudiantes
// Retorna un array con ID, nombre, asistencias, total clases y porcentaje
export function calcularAsistenciaGeneral() {
  const totalClases = clases.length;

  // Para cada estudiante, contar cuántas asistencias tiene y calcular el porcentaje
  return estudiantes.map((est) => {
    const totalAsistencias = asistencias.filter(
      (a) => a.estudianteId === est.id
    ).length;

    // Calcular el porcentaje de asistencia
    const porcentaje =
      totalClases > 0 ? Math.round((totalAsistencias / totalClases) * 100) : 0;

    // Retornar un objeto con el ID, nombre, total asistencias, total clases y porcentaje
    return {
      id: est.id,
      nombre: est.nombre,
      asistencias: totalAsistencias,
      totalClases,
      porcentaje,
    };
  });
}

// LOGS DE AUDITORÍA

// Retorna todos los logs de errores registrados para auditoría
export function obtenerErrorLogs() {
  return errorLogs;
}