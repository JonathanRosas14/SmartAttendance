// Controlador para generar QR dinámicos
import pool from "../models/db.js";

export async function generarQR(req, res) {
  const { claseId, duracionSegundos = 60 } = req.body;

  try {
    const clase = await pool.query("SELECT id FROM clases WHERE id = $1", [claseId]);

    if (clase.rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Clase no encontrada." });
    }

    const qrData = {
      claseId,
      token: Math.random().toString(36).substring(2) + Date.now().toString(36),
      expiracion: Date.now() + duracionSegundos * 1000,
    };

    return res.json({ ok: true, qr: JSON.stringify(qrData) });
  } catch (error) {
    console.error("Error generando QR:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
}