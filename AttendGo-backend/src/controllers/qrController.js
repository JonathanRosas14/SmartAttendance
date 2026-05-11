// Controlador para generar QR dinámicos
import jwt from "jsonwebtoken";
import pool from "../models/db.js";

export async function generarQR(req, res) {
  const { claseId, duracionSegundos, duracion } = req.body;
  const profesorId = req.usuario.id;
  const duracionQR = Math.min(Math.max(Number(duracionSegundos || duracion || 60), 10), 300);

  try {
    const clase = await pool.query(
      "SELECT id FROM clases WHERE id = $1 AND profesor_id = $2",
      [claseId, profesorId]
    );

    if (clase.rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Clase no encontrada." });
    }

    const expiracion = Date.now() + duracionQR * 1000;
    const token = jwt.sign(
      { tipo: "attendance_qr", claseId },
      process.env.JWT_SECRET,
      { expiresIn: duracionQR }
    );

    const qrData = {
      claseId,
      token,
      expiracion,
    };

    return res.json({ ok: true, qr: JSON.stringify(qrData) });
  } catch (error) {
    console.error("Error generando QR:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
}
