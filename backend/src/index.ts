import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { router as healthRouter } from "./routes/health";
import { busRouter } from "./routes/bus"; 
import { stopsRouter } from "./routes/stops";



dotenv.config();
const app = express();

app.use("/api/stops", stopsRouter);
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/health", healthRouter);
app.use("/api/bus", busRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
