import { estudiantes } from "../models/estudiantes";
import { clases, asistencias, errorLogs } from "../models/clases";
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
      return { ok: true, mensaje: `${existe.nombre} vinculado a la clase.` };
    }
    return {
      ok: false,
      mensaje: "El estudiante ya está vinculado a esta clase.",
    };
  }

  estudiantes.push({ id, nombre, celular, clases: [claseId] });
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
