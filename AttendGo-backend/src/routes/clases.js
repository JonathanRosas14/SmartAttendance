import express from "express";
import { crearClase, obtenerClases, editarClase, borrarClase } from "../controllers/clasesController.js";
import { verificarToken, soloProfesor } from "../middleware/auth.js";

const router = express.Router();

router.use(verificarToken, soloProfesor);
router.post("/",          crearClase);
router.get("/",           obtenerClases);
router.put("/:id",        editarClase);
router.delete("/:id",     borrarClase);

export default router;