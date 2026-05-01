// Controlador de asistencias — registrar QR, manual, historial y estadísticas
import pool from "../models/db.js";

function getFechaHoy() {
  return new Date().toISOString().split("T")[0];
}

function getHoraActual() {
  return new Date().toTimeString().split(" ")[0].substring(0, 5);
}

// REGISTRAR ASISTENCIA POR QR
export async function registrarAsistenciaQR(req, res) {
  const { numeroIdentificacion, claseId, qrData, macAddress } = req.body;

  try {
    // Validar que el estudiante exista por número de identificación
    const estudiante = await pool.query(
      "SELECT * FROM estudiantes WHERE numero_identificacion = $1",
      [numeroIdentificacion]
    );

    console.log("🔍 DEBUG QR:");
    console.log("  numero_identificacion recibido:", numeroIdentificacion);
    console.log("  claseId recibido:", claseId);
    console.log("  Estudiante encontrado:", estudiante.rows.length > 0 ? "SÍ" : "NO");

    if (estudiante.rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Estudiante no encontrado." });
    }

    const estudianteRow = estudiante.rows[0];
    console.log("  ID del estudiante encontrado:", estudianteRow.id);

    // Validar que pertenezca a la clase
    const vinculo = await pool.query(
      "SELECT id FROM clase_estudiantes WHERE clase_id = $1 AND estudiante_id = $2",
      [claseId, estudianteRow.id]
    );

    console.log("  Vínculo con clase_estudiantes:", vinculo.rows.length > 0 ? "SÍ ✓" : "NO ✗");
    
    if (vinculo.rows.length === 0) {
      // Mostrar todos los vínculos para esta clase para debug
      const todosVinculos = await pool.query(
        "SELECT estudiante_id FROM clase_estudiantes WHERE clase_id = $1",
        [claseId]
      );
      console.log("  Estudiantes en esta clase:", todosVinculos.rows.map(r => r.estudiante_id));
      
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

    if (Date.now() > qr.expiracion) {
      return res.status(400).json({ ok: false, mensaje: "El QR ha expirado. Solicita uno nuevo." });
    }

    // Validar horario de la clase (con margen de 30 minutos antes/después)
    const clase = await pool.query(
      "SELECT hora_inicio, hora_fin FROM clases WHERE id = $1",
      [claseId]
    );

    const ahora = getHoraActual();
    const { hora_inicio, hora_fin } = clase.rows[0];                                      

    // Convertir horas a minutos para comparación más precisa
    const [ahoraH, ahoraM] = ahora.split(':').map(Number);
    const [inicioH, inicioM] = hora_inicio.split(':').map(Number);
    const [finH, finM] = hora_fin.split(':').map(Number);

    const ahoraMinutos = ahoraH * 60 + ahoraM;
    const inicioMinutos = inicioH * 60 + inicioM - 30; // 30 min antes
    const finMinutos = finH * 60 + finM + 30; // 30 min después

    console.log("  Minutos ahora:", ahoraMinutos);
    console.log("  Minutos inicio (con -30):", inicioMinutos);
    console.log("  Minutos fin (con +30):", finMinutos);

    if (ahoraMinutos < inicioMinutos || ahoraMinutos > finMinutos) {
      console.log("  ❌ FUERA DE HORARIO!");
      return res.status(403).json({ ok: false, mensaje: "Estás fuera del horario permitido." });
    }
    console.log("  ✅ DENTRO DE HORARIO");

    // Validar que no haya duplicado hoy
    const fecha = getFechaHoy();
    const duplicado = await pool.query(
      "SELECT id FROM asistencias WHERE estudiante_id = $1 AND clase_id = $2 AND fecha = $3",
      [estudianteRow.id, claseId, fecha]
    );

    if (duplicado.rows.length > 0) {
      return res.status(409).json({ ok: false, mensaje: "Ya registraste asistencia hoy en esta clase." });
    }

    // Registrar asistencia
    await pool.query(
      "INSERT INTO asistencias (estudiante_id, clase_id, fecha, hora, tipo, mac_address) VALUES ($1, $2, $3, $4, $5, $6)",
      [estudianteRow.id, claseId, fecha, getHoraActual(), "qr", macAddress || null]
    );

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

  if (!claseId || !registros || !Array.isArray(registros)) {
    return res.status(400).json({ ok: false, mensaje: "Datos inválidos." });
  }

  try {
    const clase = await pool.query("SELECT id FROM clases WHERE id = $1", [claseId]);
    if (clase.rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Clase no encontrada." });
    }

    const fecha = getFechaHoy();
    const hora = getHoraActual();
    let guardados = 0;

    for (const r of registros) {
      if (!r.asistio) continue;

      // Verificar duplicado
      const dup = await pool.query(
        "SELECT id FROM asistencias WHERE estudiante_id = $1 AND clase_id = $2 AND fecha = $3",
        [r.estudianteId, claseId, fecha]
      );
      if (dup.rows.length > 0) continue;

      await pool.query(
        "INSERT INTO asistencias (estudiante_id, clase_id, fecha, hora, tipo) VALUES ($1, $2, $3, $4, $5)",
        [r.estudianteId, claseId, fecha, hora, "manual"]
      );
      guardados++;
    }

    return res.json({ ok: true, mensaje: `${guardados} asistencia(s) guardada(s).` });
  } catch (error) {
    console.error("Error guardando asistencia manual:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
}

// HISTORIAL DE ASISTENCIAS DE UN ESTUDIANTE
export async function obtenerHistorialEstudiante(req, res) {
  const estudianteId = req.usuario.id;

  try {
    const resultado = await pool.query(
      `SELECT a.fecha, a.hora, a.tipo, c.nombre AS "claseNombre", c.id AS "claseId"
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

  try {
    const resultado = await pool.query(
      `SELECT
         e.id, e.nombre,
         COUNT(a.id) AS asistencias,
         (SELECT COUNT(DISTINCT fecha) FROM asistencias WHERE clase_id = $1) AS "totalSesiones"
       FROM estudiantes e
       INNER JOIN clase_estudiantes ce ON e.id = ce.estudiante_id
       LEFT JOIN asistencias a ON a.estudiante_id = e.id AND a.clase_id = $1
       WHERE ce.clase_id = $1
       GROUP BY e.id, e.nombre
       ORDER BY e.nombre ASC`,
      [claseId]
    );

    const estadisticas = resultado.rows.map((r) => ({
      ...r,
      asistencias: parseInt(r.asistencias),
      totalClases: parseInt(r.totalSesiones),
      porcentaje:
        r.totalSesiones > 0
          ? Math.round((r.asistencias / r.totalSesiones) * 100)
          : 0,
    }));

    return res.json({ ok: true, estadisticas });
  } catch (error) {
    console.error("Error calculando asistencia:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
}

// SESIONES REGISTRADAS POR CLASE
export async function obtenerSesionesPorClase(req, res) {
  const { claseId } = req.params;

  try {
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

  try {
    const resultado = await pool.query(
      `SELECT 
         a.id, a.fecha, a.hora, a.tipo, a.mac_address,
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