import { estudiantes } from "../models/estudiantes";
import { clases, asistencias, errorLogs } from "../models/clases";
import { getCurrentTime, getCurrentDate } from "../utils/time";

// Crear una nueva clase

// Validaciones: nombre no vacío, horaInicio < horaFin, ID único
export function crearClase({ id, nombre, horaInicio, horaFin }) {
  if (!nombre || nombre.trim() === "") {
    return {
      ok: false,
      mensaje: "El nombre de la clase no puede estar vacío.",
    };
  }
  // Validar formato de hora (HH:mm)
  if (horaInicio >= horaFin) {
    return {
      ok: false,
      mensaje: "La hora de inicio debe ser menor a la hora de fin.",
    };
  }

  // Validar que el ID sea único
  const existe = clases.find((c) => c.id === id);
  if (existe) {
    return { ok: false, mensaje: "Ya existe una clase con ese ID." };
  }
  // Si todo es válido, crear la clase
  clases.push({ id, nombre, horaInicio, horaFin });
  return { ok: true, mensaje: "Clase creada exitosamente." };
}

// Validaciones comunes para ambos tipos de registro
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
      a.fecha === fecha,
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

// Nuevo registro de asistencia por QR

// Validaciones: estudiante existe, pertenece a la clase, celular coincide, QR válido y vigente, dentro del horario, no duplicado
export function registrarAsistenciaQR({
  estudianteId,
  celular,
  claseId,
  qrData,
}) {
  const estudiante = validarEstudiante(estudianteId);
  // Validar existencia del estudiante
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
    // Validar que el QR corresponda a la clase y que no haya expirado
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
    return {
      ok: false,
      mensaje: "Ya registraste asistencia hoy en esta clase.",
    };
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
    mensaje: `Asistencia registrada correctamente. ¡Hola ${estudiante.nombre}!`,
  };
}

// Registro de asistencia manual por el profesor
// Validaciones: estudiante existe, pertenece a la clase, no duplicado
export function registrarAsistenciaManual({ estudianteId, claseId }) {
  const estudiante = validarEstudiante(estudianteId);
  if (!estudiante) {
    return { ok: false, mensaje: "Estudiante no encontrado." };
  }
  // Validar que el estudiante pertenezca a la clase
  if (!validarPertenencia(estudiante, claseId)) {
    return { ok: false, mensaje: "El estudiante no pertenece a esta clase." };
  }
  // Validar que no haya un registro previo para el mismo estudiante, clase y fecha
  if (validarDuplicado(estudianteId, claseId)) {
    return {
      ok: false,
      mensaje: "El estudiante ya tiene asistencia registrada hoy.",
    };
  }
  // Si todas las validaciones pasan, registrar la asistencia manual
  asistencias.push({
    estudianteId,
    claseId,
    fecha: getCurrentDate(),
    hora: getCurrentTime(),
    tipo: "manual",
  });
  // Retornar mensaje de éxito con el nombre del estudiante
  return {
    ok: true,
    mensaje: `Asistencia manual registrada para ${estudiante.nombre}.`,
  };
}

// Calcular el porcentaje de asistencia de cada estudiante en cada clase
// Retorna un array con el porcentaje de asistencia de cada estudiante en cada clase a la que esté inscrito
export function calcularAsistencia() {
  const totalClases = clases.length;
  if (totalClases === 0) return [];
  // Para cada estudiante, contar cuántas asistencias tiene y calcular el porcentaje
  return estudiantes.map((est) => {
    const totalAsistencias = asistencias.filter(
      (a) => a.estudianteId === est.id,
    ).length;
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
