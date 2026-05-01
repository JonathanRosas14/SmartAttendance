// Punto de entrada del servidor Express
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes       from "./routes/auth.js";
import clasesRoutes     from "./routes/clases.js";
import estudiantesRoutes from "./routes/estudiantes.js";
import asistenciaRoutes from "./routes/asistencia.js";
import qrRoutes         from "./routes/qr.js";

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rutas principales
app.use("/api/auth",        authRoutes);
app.use("/api/clases",      clasesRoutes);
app.use("/api/estudiantes", estudiantesRoutes);
app.use("/api/asistencia",  asistenciaRoutes);
app.use("/api/qr",          qrRoutes);

// Ruta de salud para verificar que el servidor está funcionando
app.get("/health", (req, res) => {
  res.json({ ok: true, mensaje: "SmartAttendance API funcionando ✅" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});