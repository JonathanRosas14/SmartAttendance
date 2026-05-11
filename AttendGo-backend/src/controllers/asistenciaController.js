// Controlador de asistencias — registrar QR, manual, historial y estadísticas
import jwt from "jsonwebtoken";
import pool from "../models/db.js";

function getFechaHoy() {
  const ahora = new Date();
  const year = ahora.getFullYear();
  const month = String(ahora.getMonth() + 1).padStart(2, "0");
  const day = String(ahora.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getHoraActual() {
  return new Date().toTimeString().split(" ")[0].substring(0, 5);
}

async function obtenerClaseDelProfesor(claseId, profesorId) {
  const clase = await pool.query(
    "SELECT id FROM clases WHERE id = $1 AND profesor_id = $2",
    [claseId, profesorId]
  );
  return clase.rows[0] || null;
}

// REGISTRAR ASISTENCIA POR QR
export async function registrarAsistenciaQR(req, res) {
  const { claseId, qrData, macAddress } = req.body;
  const estudianteId = req.usuario.id;

  if (!claseId || !qrData) {
    return res.status(400).json({ ok: false, mensaje: "Clase y QR son obligatorios." });
  }

  try {
    const estudiante = await pool.query(
      "SELECT id, nombre FROM estudiantes WHERE id = $1",
      [estudianteId]
    );

    if (estudiante.rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Estudiante no encontrado." });
    }

    const estudianteRow = estudiante.rows[0];

    // Validar que pertenezca a la clase
    const vinculo = await pool.query(
      "SELECT id FROM clase_estudiantes WHERE clase_id = $1 AND estudiante_id = $2",
      [claseId, estudianteRow.id]
    );

    if (vinculo.rows.length === 0) {
      return res.status(403).json({ ok: false, mensaje: "No estás inscrito en esta clase." });
    }

    // Validar el QR
    let qr;
    try {
      qr = JSON.parse(qrData);
    } catch {
      return res.status(400).json({ ok: false, mensaje: "QR inválido o modificado." });
    }

    if (qr.claseId !== claseId) {
      return res.status(400).json({ ok: false, mensaje: "El QR no corresponde a esta clase." });
    }

    try {
      const payload = jwt.verify(qr.token, process.env.JWT_SECRET);
      if (payload.tipo !== "attendance_qr" || payload.claseId !== claseId) {
        return res.status(400).json({ ok: false, mensaje: "QR inválido o modificado." });
      }
    } catch {
      return res.status(400).json({ ok: false, mensaje: "QR inválido o expirado." });
    }

    if (Date.now() > qr.expiracion) {
      return res.status(400).json({ ok: false, mensaje: "El QR ha expirado. Solicita uno nuevo." });
    }

    // Validar horario de la clase (con margen de 30 minutos antes/después)
    const clase = await pool.query(
      "SELECT hora_inicio, hora_fin FROM clases WHERE id = $1",
      [claseId]
    );

    if (clase.rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Clase no encontrada." });
    }

    const ahora = getHoraActual();
    const { hora_inicio, hora_fin } = clase.rows[0];                                      

    // Convertir horas a minutos para comparación más precisa
    const [ahoraH, ahoraM] = ahora.split(':').map(Number);
    const [inicioH, inicioM] = hora_inicio.split(':').map(Number);
    const [finH, finM] = hora_fin.split(':').map(Number);

    const ahoraMinutos = ahoraH * 60 + ahoraM;
    const inicioMinutos = inicioH * 60 + inicioM - 30; // 30 min antes
    const finMinutos = finH * 60 + finM + 30; // 30 min después

    if (ahoraMinutos < inicioMinutos || ahoraMinutos > finMinutos) {
      return res.status(403).json({ ok: false, mensaje: "Estás fuera del horario permitido." });
    }

    const fecha = getFechaHoy();

    const insertado = await pool.query(
      `INSERT INTO asistencias (estudiante_id, clase_id, fecha, hora, asistio, tipo, mac_address)
       VALUES ($1, $2, $3, $4, TRUE, 'qr', $5)
       ON CONFLICT (estudiante_id, clase_id, fecha) DO NOTHING
       RETURNING id`,
      [estudianteRow.id, claseId, fecha, getHoraActual(), macAddress || null]
    );

    if (insertado.rowCount === 0) {
      return res.status(409).json({ ok: false, mensaje: "Ya registraste asistencia hoy en esta clase." });
    }

    return res.status(201).json({
      ok: true,
      mensaje: `¡Asistencia registrada! Bienvenido ${estudianteRow.nombre}.`,
    });
  } catch (error) {
    console.error("Error registrando asistencia QR:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
}

// REGISTRAR ASISTENCIA MANUAL (lote)
export async function guardarAsistenciaManual(req, res) {
  const { claseId, registros } = req.body;
  const profesorId = req.usuario.id;

  if (!claseId || !registros || !Array.isArray(registros)) {
    return res.status(400).json({ ok: false, mensaje: "Datos inválidos." });
  }

  if (registros.length === 0) {
    return res.status(400).json({ ok: false, mensaje: "No hay registros para guardar." });
  }

  const client = await pool.connect();

  try {
    const clase = await obtenerClaseDelProfesor(claseId, profesorId);
    if (!clase) {
      return res.status(404).json({ ok: false, mensaje: "Clase no encontrada." });
    }

    const fecha = getFechaHoy();
    const hora = getHoraActual();
    const horaActual = parseInt(new Date().toTimeString().split(":")[0], 10);
    const esManana = horaActual < 12;
    let guardados = 0;
    let actualizados = 0;
    let invalidos = 0;

    await client.query("BEGIN");

    for (const r of registros) {
      if (!r.estudianteId) {
        invalidos++;
        continue;
      }

      const asistio = Boolean(r.asistio);

      let resultado;
      if (esManana) {
        resultado = await client.query(
          `INSERT INTO asistencias (estudiante_id, clase_id, fecha, hora, asistio, tipo)
           SELECT $1::varchar, $2::varchar, $3::date, $4::time, $5::boolean, 'manual'::varchar
           WHERE EXISTS (
             SELECT 1 FROM clase_estudiantes WHERE clase_id = $2::varchar AND estudiante_id = $1::varchar
           )
           RETURNING id`,
          [r.estudianteId, claseId, fecha, hora, asistio]
        );
        if (resultado.rowCount > 0) {
          guardados++;
        } else {
          invalidos++;
        }
      } else {
        resultado = await client.query(
          `INSERT INTO asistencias (estudiante_id, clase_id, fecha, hora, asistio, tipo)
           SELECT $1::varchar, $2::varchar, $3::date, $4::time, $5::boolean, 'manual'::varchar
           WHERE EXISTS (
             SELECT 1 FROM clase_estudiantes WHERE clase_id = $2::varchar AND estudiante_id = $1::varchar
           )
           ON CONFLICT (estudiante_id, clase_id, fecha)
           DO UPDATE SET asistio = EXCLUDED.asistio, hora = EXCLUDED.hora, tipo = EXCLUDED.tipo
           RETURNING (xmax::text = '0'::text) AS insertado`,
          [r.estudianteId, claseId, fecha, hora, asistio]
        );
        if (resultado.rowCount === 0) {
          invalidos++;
        } else if (resultado.rows[0].insertado) {
          guardados++;
        } else {
          actualizados++;
        }
      }
    }

    await client.query("COMMIT");

    return res.json({
      ok: true,
      mensaje: `${guardados} registro(s) guardado(s), ${actualizados} actualizado(s), ${invalidos} inválido(s).`,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error guardando asistencia manual:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  } finally {
    client.release();
  }
}

// HISTORIAL DE ASISTENCIAS DE UN ESTUDIANTE
export async function obtenerHistorialEstudiante(req, res) {
  const estudianteId = req.usuario.id;

  try {
    const resultado = await pool.query(
      `SELECT a.fecha, a.hora, a.tipo, a.asistio, c.nombre AS "claseNombre", c.id AS "claseId"
       FROM asistencias a
       INNER JOIN clases c ON a.clase_id = c.id
       WHERE a.estudiante_id = $1
       ORDER BY a.fecha DESC, a.hora DESC`,
      [estudianteId]
    );

    return res.json({ ok: true, historial: resultado.rows });
  } catch (error) {
    console.error("Error obteniendo historial:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
}

// ESTADÍSTICAS DE ASISTENCIA POR CLASE
export async function calcularAsistenciaPorClase(req, res) {
  const { claseId } = req.params;
  const profesorId = req.usuario.id;

  try {
    const clase = await obtenerClaseDelProfesor(claseId, profesorId);
    if (!clase) {
      return res.status(404).json({ ok: false, mensaje: "Clase no encontrada." });
    }

    const resultado = await pool.query(
      `SELECT
         e.id, e.nombre,
         COUNT(a.id) FILTER (WHERE a.asistio IS TRUE) AS asistencias,
         (SELECT COUNT(DISTINCT fecha) FROM asistencias WHERE clase_id = $1) AS "totalSesiones"
       FROM estudiantes e
       INNER JOIN clase_estudiantes ce ON e.id = ce.estudiante_id
       LEFT JOIN asistencias a ON a.estudiante_id = e.id AND a.clase_id = $1
       WHERE ce.clase_id = $1
       GROUP BY e.id, e.nombre
       ORDER BY e.nombre ASC`,
      [claseId]
    );

    const estadisticas = resultado.rows.map((r) => {
      const asistencias = parseInt(r.asistencias, 10);
      const totalClases = parseInt(r.totalSesiones, 10);
      return {
        ...r,
        asistencias,
        totalClases,
        porcentaje: totalClases > 0 ? Math.round((asistencias / totalClases) * 100) : 0,
      };
    });

    return res.json({ ok: true, estadisticas });
  } catch (error) {
    console.error("Error calculando asistencia:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
}

// SESIONES REGISTRADAS POR CLASE
export async function obtenerSesionesPorClase(req, res) {
  const { claseId } = req.params;
  const profesorId = req.usuario.id;

  try {
    const clase = await obtenerClaseDelProfesor(claseId, profesorId);
    if (!clase) {
      return res.status(404).json({ ok: false, mensaje: "Clase no encontrada." });
    }

    const resultado = await pool.query(
      `SELECT fecha, COUNT(*) AS total
       FROM asistencias
       WHERE clase_id = $1
       GROUP BY fecha
       ORDER BY fecha DESC`,
      [claseId]
    );

    return res.json({ ok: true, sesiones: resultado.rows });
  } catch (error) {
    console.error("Error obteniendo sesiones:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
}

// OBTENER TODAS LAS ASISTENCIAS DE UNA CLASE CON DETALLES
export async function obtenerAsistenciasClaseDetallado(req, res) {
  const { claseId } = req.params;
  const profesorId = req.usuario.id;

  try {
    const clase = await obtenerClaseDelProfesor(claseId, profesorId);
    if (!clase) {
      return res.status(404).json({ ok: false, mensaje: "Clase no encontrada." });
    }

    const resultado = await pool.query(
      `SELECT 
         a.id, a.fecha, a.hora, a.asistio, a.tipo, a.mac_address,
         e.id AS estudiante_id, e.nombre AS estudiante_nombre, e.numero_identificacion
       FROM asistencias a
       INNER JOIN estudiantes e ON a.estudiante_id = e.id
       WHERE a.clase_id = $1
       ORDER BY a.fecha DESC, a.hora DESC`,
      [claseId]
    );

    return res.json({ ok: true, asistencias: resultado.rows });
  } catch (error) {
    console.error("Error obteniendo asistencias detallado:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
}
