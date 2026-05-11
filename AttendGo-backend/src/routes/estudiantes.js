import express from "express";
import { vincularEstudiante, obtenerEstudiantesPorClase, desvincularEstudiante } from "../controllers/estudiantesController.js";
import { verificarToken, soloProfesor } from "../middleware/auth.js";

const router = express.Router();

router.use(verificarToken, soloProfesor);
router.post("/vincular",                           vincularEstudiante);
router.get("/clase/:claseId",                      obtenerEstudiantesPorClase);
router.delete("/clase/:claseId/:estudianteId",     desvincularEstudiante);

export default router;