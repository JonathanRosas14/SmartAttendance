import express from "express";
import { login, registrarEstudiante, registrarProfesor } from "../controllers/authController.js";
import { verificarToken, soloEstudiante, soloProfesor } from "../middleware/auth.js";
import { actualizarPerfilEstudiante, actualizarPerfilProfesor } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/registro/estudiante", registrarEstudiante);
router.post("/registro/profesor", registrarProfesor);
router.put("/perfil/profesor", verificarToken, soloProfesor, actualizarPerfilProfesor);
router.put("/perfil/estudiante", verificarToken, soloEstudiante, actualizarPerfilEstudiante);

export default router;