import express from "express";
import { login, registrarEstudiante, registrarProfesor } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/registro/estudiante", registrarEstudiante);
router.post("/registro/profesor", registrarProfesor);

export default router;