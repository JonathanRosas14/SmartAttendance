// Controlador de clases — CRUD completo
import pool from "../models/db.js";

// Generar ID automático para clases
function generarClaseId(nombre) {
  return (
    nombre.replace(/\s+/g, "").toUpperCase().substring(0, 8) +
    Date.now().toString(36).toUpperCase()
  );
}

export async function crearClase(req, res) {
  const { nombre, horaInicio, horaFin } = req.body;
  const profesorId = req.usuario.id;

  if (!nombre || !horaInicio || !horaFin) {
    return res.status(400).json({ ok: false, mensaje: "Todos los campos son obligatorios." });
  }
  if (horaInicio >= horaFin) {
    return res.status(400).json({ ok: false, mensaje: "La hora de inicio debe ser menor a la hora de fin." });
  }

  try {
    const claseId = generarClaseId(nombre);

    await pool.query(
      "INSERT INTO clases (id, nombre, hora_inicio, hora_fin, profesor_id) VALUES ($1, $2, $3, $4, $5)",
      [claseId, nombre, horaInicio, horaFin, profesorId]
    );

    return res.status(201).json({ ok: true, mensaje: "Clase creada exitosamente.", claseId });
  } catch (error) {
    console.error("Error creando clase:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
}

export async function obtenerClases(req, res) {
  const profesorId = req.usuario.id;

  try {
    const resultado = await pool.query(
      "SELECT id, nombre, hora_inicio AS \"horaInicio\", hora_fin AS \"horaFin\" FROM clases WHERE profesor_id = $1 ORDER BY created_at DESC",
      [profesorId]
    );

    return res.json({ ok: true, clases: resultado.rows });
  } catch (error) {
    console.error("Error obteniendo clases:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
}

export async function editarClase(req, res) {
  const { id } = req.params;
  const { nombre, horaInicio, horaFin } = req.body;
  const profesorId = req.usuario.id;

  try {
    const clase = await pool.query(
      "SELECT id FROM clases WHERE id = $1 AND profesor_id = $2",
      [id, profesorId]
    );

    if (clase.rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Clase no encontrada." });
    }

    if (horaInicio && horaFin && horaInicio >= horaFin) {
      return res.status(400).json({ ok: false, mensaje: "La hora de inicio debe ser menor a la hora de fin." });
    }

    await pool.query(
      `UPDATE clases SET
        nombre = COALESCE($1, nombre),
        hora_inicio = COALESCE($2, hora_inicio),
        hora_fin = COALESCE($3, hora_fin)
       WHERE id = $4`,
      [nombre, horaInicio, horaFin, id]
    );

    return res.json({ ok: true, mensaje: "Clase actualizada correctamente." });
  } catch (error) {
    console.error("Error editando clase:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
}

export async function borrarClase(req, res) {
  const { id } = req.params;
  const profesorId = req.usuario.id;

  try {
    const resultado = await pool.query(
      "DELETE FROM clases WHERE id = $1 AND profesor_id = $2",
      [id, profesorId]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ ok: false, mensaje: "Clase no encontrada." });
    }

    return res.json({ ok: true, mensaje: "Clase eliminada." });
  } catch (error) {
    console.error("Error borrando clase:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
}