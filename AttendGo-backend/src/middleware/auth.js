// Middleware de autenticación JWT
// Verifica que el token sea válido antes de permitir acceso a rutas protegidas
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export function verificarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ ok: false, mensaje: "Token requerido." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch {
    return res.status(403).json({ ok: false, mensaje: "Token inválido o expirado." });
  }
}

export function soloProfesor(req, res, next) {
  if (req.usuario?.rol !== "profesor") {
    return res.status(403).json({ ok: false, mensaje: "Solo los profesores pueden hacer esto." });
  }
  next();
}

export function soloEstudiante(req, res, next) {
  if (req.usuario?.rol !== "estudiante") {
    return res.status(403).json({ ok: false, mensaje: "Solo los estudiantes pueden hacer esto." });
  }
  next();
}