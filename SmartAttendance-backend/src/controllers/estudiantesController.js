// Controlador de estudiantes — vincular, listar, eliminar
import pool from "../models/db.js";

// Generar ID automático
function generarIdEstudiante() {
  return (
    'STU-' + new Date().getFullYear() + '-' + Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()
  );
}

export async function vincularEstudiante(req, res) {
  const { numeroIdentificacion, nombre, celular, claseId } = req.body;

  if (!numeroIdentificacion || !nombre || !celular || !claseId) {
    return res.status(400).json({ ok: false, mensaje: "Todos los campos son obligatorios." });
  }

  try {
    // Verificar que la clase exista
    const clase = await pool.query("SELECT id FROM clases WHERE id = $1", [claseId]);
    if (clase.rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "La clase no existe." });
    }

    // Verificar si ya existe estudiante con este número de identificación
    const existe = await pool.query("SELECT id FROM estudiantes WHERE numero_identificacion = $1", [numeroIdentificacion]);

    let estudianteId;

    if (existe.rows.length === 0) {
      // Crear nuevo estudiante
      estudianteId = generarIdEstudiante();
      const correoTemp = `${numeroIdentificacion}@temp.edu`;
      
      await pool.query(
        "INSERT INTO estudiantes (id, numero_identificacion, nombre, correo, contrasena, celular) VALUES ($1, $2, $3, $4, $5, $6)",
        [estudianteId, numeroIdentificacion, nombre, correoTemp, "sin_cuenta", celular]
      );
    } else {
      // Estudiante ya existe, usar su ID
      estudianteId = existe.rows[0].id;
    }

    // Vincular a la clase (ON CONFLICT evita duplicados)
    await pool.query(
      "INSERT INTO clase_estudiantes (clase_id, estudiante_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [claseId, estudianteId]
    );

    return res.status(201).json({ ok: true, mensaje: `Estudiante ${nombre} (${numeroIdentificacion}) vinculado a la clase.` });
  } catch (error) {
    console.error("Error vinculando estudiante:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
}

export async function obtenerEstudiantesPorClase(req, res) {
  const { claseId } = req.params;

  try {
    const resultado = await pool.query(
      `SELECT e.id, e.numero_identificacion, e.nombre, e.celular
       FROM estudiantes e
       INNER JOIN clase_estudiantes ce ON e.id = ce.estudiante_id
       WHERE ce.clase_id = $1
       ORDER BY e.nombre ASC`,
      [claseId]
    );

    return res.json({ ok: true, estudiantes: resultado.rows });
  } catch (error) {
    console.error("Error obteniendo estudiantes:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
}

export async function desvincularEstudiante(req, res) {
  const { claseId, estudianteId } = req.params;

  try {
    await pool.query(
      "DELETE FROM clase_estudiantes WHERE clase_id = $1 AND estudiante_id = $2",
      [claseId, estudianteId]
    );

    return res.json({ ok: true, mensaje: "Estudiante desvinculado." });
  } catch (error) {
    console.error("Error desvinculando estudiante:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
}