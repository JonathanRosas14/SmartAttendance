// Controlador de autenticación
// Maneja login y registro de profesores y estudiantes
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../models/db.js";
import dotenv from "dotenv";

dotenv.config();

// Genera un ID automático si el usuario no proporciona uno
function generarId(prefijo) {
  return `${prefijo}-${new Date().getFullYear()}-${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}`;
}

// LOGIN — valida correo, contraseña y rol
export async function login(req, res) {
  const { correo, contrasena, rol } = req.body;

  if (!correo || !contrasena || !rol) {
    return res.status(400).json({ ok: false, mensaje: "Todos los campos son obligatorios." });
  }

  try {
    const tabla = rol === "profesor" ? "profesores" : "estudiantes";
    const resultado = await pool.query(
      `SELECT * FROM ${tabla} WHERE correo = $1`,
      [correo]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({ ok: false, mensaje: "Correo no encontrado." });
    }

    const usuario = resultado.rows[0];
    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);

    if (!contrasenaValida) {
      return res.status(401).json({ ok: false, mensaje: "Contraseña incorrecta." });
    }

    // Generar token JWT con duración configurada en .env
    const token = jwt.sign(
      { id: usuario.id, correo: usuario.correo, rol, nombre: usuario.nombre },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Para estudiantes, incluir numero_identificacion
    const usuarioData = { 
      id: usuario.id, 
      correo: usuario.correo, 
      rol, 
      nombre: usuario.nombre,
    };
    if (rol === "profesor") {
      usuarioData.departamento = usuario.departamento || "";
    }
    if (rol === "estudiante" && usuario.numero_identificacion) {
      usuarioData.numero_identificacion = usuario.numero_identificacion;
      usuarioData.celular = usuario.celular || "";
    }

    return res.json({
      ok: true,
      token,
      usuario: usuarioData,
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
}

// REGISTRO DE ESTUDIANTE
export async function registrarEstudiante(req, res) {
  const { nombre, id, numeroIdentificacion, celular, correo, contrasena } = req.body;
  const numId = numeroIdentificacion || id; // Aceptar ambos nombres

  if (!nombre || !numId || !celular || !correo || !contrasena) {
    return res.status(400).json({ ok: false, mensaje: "Todos los campos son obligatorios." });
  }

  try {
    // Verificar si el número de identificación ya existe
    const existeNumId = await pool.query(
      "SELECT id, correo, contrasena FROM estudiantes WHERE numero_identificacion = $1",
      [numId]
    );

    // Si ya existe, distinguir entre cuenta real y placeholder creado por vinculación
    if (existeNumId.rows.length > 0) {
      const estudianteExistente = existeNumId.rows[0];
      const esPlaceholder =
        estudianteExistente.correo?.endsWith("@temp.edu") ||
        estudianteExistente.contrasena === "sin_cuenta";

      if (!esPlaceholder) {
        return res.status(400).json({ ok: false, mensaje: "El número de identificación ya está registrado." });
      }

      // Validar correo duplicado excluyendo al mismo estudiante placeholder
      const correoDuplicado = await pool.query(
        "SELECT id FROM estudiantes WHERE correo = $1 AND id <> $2",
        [correo, estudianteExistente.id]
      );

      if (correoDuplicado.rows.length > 0) {
        return res.status(400).json({ ok: false, mensaje: "El correo ya está registrado." });
      }

      const hash = await bcrypt.hash(contrasena, 10);
      await pool.query(
        `UPDATE estudiantes
         SET nombre = $1, correo = $2, contrasena = $3, celular = $4
         WHERE id = $5`,
        [nombre, correo, hash, celular, estudianteExistente.id]
      );

      return res.status(200).json({
        ok: true,
        mensaje: `Cuenta activada para ${nombre}.`,
      });
    }

    // Registro normal de estudiante nuevo
    const existeCorreo = await pool.query(
      "SELECT id FROM estudiantes WHERE correo = $1",
      [correo]
    );

    if (existeCorreo.rows.length > 0) {
      return res.status(400).json({ ok: false, mensaje: "El correo ya está registrado." });
    }

    const estudianteId = generarId("STU");
    const hash = await bcrypt.hash(contrasena, 10);

    await pool.query(
      "INSERT INTO estudiantes (id, numero_identificacion, nombre, correo, contrasena, celular) VALUES ($1, $2, $3, $4, $5, $6)",
      [estudianteId, numId, nombre, correo, hash, celular]
    );

    return res.status(201).json({ ok: true, mensaje: `Estudiante ${nombre} registrado exitosamente.` });
  } catch (error) {
    console.error("Error registrando estudiante:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
}

// REGISTRO DE PROFESOR
export async function registrarProfesor(req, res) {
  const { nombre, id, departamento, correo, contrasena } = req.body;

  if (!nombre || !correo || !contrasena) {
    return res.status(400).json({ ok: false, mensaje: "Todos los campos son obligatorios." });
  }

  try {
    const existe = await pool.query(
      "SELECT id FROM profesores WHERE correo = $1",
      [correo]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({ ok: false, mensaje: "El correo ya está registrado." });
    }

    const profesorId = id || generarId("PRO");
    const hash = await bcrypt.hash(contrasena, 10);

    await pool.query(
      "INSERT INTO profesores (id, nombre, correo, contrasena, departamento) VALUES ($1, $2, $3, $4, $5)",
      [profesorId, nombre, correo, hash, departamento || ""]
    );

    return res.status(201).json({ ok: true, mensaje: `Profesor ${nombre} registrado exitosamente.` });
  } catch (error) {
    console.error("Error registrando profesor:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
}

export async function actualizarPerfilProfesor(req, res) {
  const { nombre, departamento, correo, contrasena } = req.body;
  const profesorId = req.usuario?.id;

  if (!profesorId) {
    return res.status(401).json({ ok: false, mensaje: "Token inválido." });
  }

  if (!nombre?.trim() || !correo?.trim()) {
    return res.status(400).json({ ok: false, mensaje: "Nombre y correo son obligatorios." });
  }

  try {
    const existeCorreo = await pool.query(
      "SELECT id FROM profesores WHERE correo = $1 AND id <> $2",
      [correo.trim(), profesorId]
    );

    if (existeCorreo.rows.length > 0) {
      return res.status(400).json({ ok: false, mensaje: "El correo ya está registrado." });
    }

    let hashContrasena = null;
    if (contrasena && contrasena.trim()) {
      if (contrasena.trim().length < 6) {
        return res.status(400).json({
          ok: false,
          mensaje: "La contraseña debe tener al menos 6 caracteres.",
        });
      }
      hashContrasena = await bcrypt.hash(contrasena.trim(), 10);
    }

    const resultado = await pool.query(
      `UPDATE profesores
       SET nombre = $1,
           departamento = $2,
           correo = $3,
           contrasena = COALESCE($4, contrasena)
       WHERE id = $5
       RETURNING id, nombre, correo, departamento`,
      [nombre.trim(), (departamento || "").trim(), correo.trim(), hashContrasena, profesorId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Profesor no encontrado." });
    }

    return res.json({
      ok: true,
      mensaje: "Perfil actualizado correctamente.",
      usuario: {
        ...resultado.rows[0],
        rol: "profesor",
      },
    });
  } catch (error) {
    console.error("Error actualizando perfil de profesor:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
}

export async function actualizarPerfilEstudiante(req, res) {
  const { nombre, celular, correo, contrasena } = req.body;
  const estudianteId = req.usuario?.id;

  if (!estudianteId) {
    return res.status(401).json({ ok: false, mensaje: "Token inválido." });
  }

  if (!nombre?.trim() || !celular?.trim() || !correo?.trim()) {
    return res.status(400).json({ ok: false, mensaje: "Nombre, celular y correo son obligatorios." });
  }

  try {
    const existeCorreo = await pool.query(
      "SELECT id FROM estudiantes WHERE correo = $1 AND id <> $2",
      [correo.trim(), estudianteId]
    );

    if (existeCorreo.rows.length > 0) {
      return res.status(400).json({ ok: false, mensaje: "El correo ya está registrado." });
    }

    let hashContrasena = null;
    if (contrasena && contrasena.trim()) {
      if (contrasena.trim().length < 6) {
        return res.status(400).json({
          ok: false,
          mensaje: "La contraseña debe tener al menos 6 caracteres.",
        });
      }
      hashContrasena = await bcrypt.hash(contrasena.trim(), 10);
    }

    const resultado = await pool.query(
      `UPDATE estudiantes
       SET nombre = $1,
           celular = $2,
           correo = $3,
           contrasena = COALESCE($4, contrasena)
       WHERE id = $5
       RETURNING id, nombre, correo, celular, numero_identificacion`,
      [nombre.trim(), celular.trim(), correo.trim(), hashContrasena, estudianteId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Estudiante no encontrado." });
    }

    return res.json({
      ok: true,
      mensaje: "Perfil actualizado correctamente.",
      usuario: {
        ...resultado.rows[0],
        rol: "estudiante",
      },
    });
  } catch (error) {
    console.error("Error actualizando perfil de estudiante:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
}