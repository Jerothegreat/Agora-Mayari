import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { corsOptions } from "./configs/corsOptions.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import livekitRoutes from "./routes/livekitRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import consultationRoutes from "./routes/consultationRoutes.js";
import facilityRoutes from "./routes/facilityRoutes.js";
import haliyaRoutes from "./routes/haliyaRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import root from "./routes/root.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use("/", root);
app.use("/api", haliyaRoutes);
app.use("/api/livekit", livekitRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/appointments", appointmentRoutes);

app.all("*splat", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

app.use(errorHandler);

export default app;
