import express from "express";
import {
  registrarAsistenciaQR,
  guardarAsistenciaManual,
  obtenerHistorialEstudiante,
  calcularAsistenciaPorClase,
  obtenerSesionesPorClase,
  obtenerAsistenciasClaseDetallado,
} from "../controllers/asistenciaController.js";
import { verificarToken, soloProfesor, soloEstudiante } from "../middleware/auth.js";

const router = express.Router();

router.post("/qr",                       verificarToken, registrarAsistenciaQR);
router.post("/manual",                   verificarToken, soloProfesor, guardarAsistenciaManual);
router.get("/historial",                 verificarToken, soloEstudiante, obtenerHistorialEstudiante);
router.get("/estadisticas/:claseId",     verificarToken, soloProfesor, calcularAsistenciaPorClase);
router.get("/sesiones/:claseId",         verificarToken, soloProfesor, obtenerSesionesPorClase);
router.get("/detalle/:claseId",          verificarToken, soloProfesor, obtenerAsistenciasClaseDetallado);

export default router;