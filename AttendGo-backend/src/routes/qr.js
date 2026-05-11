import express from "express";
import { generarQR } from "../controllers/qrController.js";
import { verificarToken, soloProfesor } from "../middleware/auth.js";

const router = express.Router();

router.post("/generar", verificarToken, soloProfesor, generarQR);

export default router;