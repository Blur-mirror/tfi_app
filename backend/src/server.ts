import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { stopsRouter } from "./routes/stops";
import { arrivalsRouter } from "./routes/arrivals";



dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/arrivals", arrivalsRouter);
app.use("/api/stops", stopsRouter);

app.get("/", (req, res) => {
  res.send("TFI API backend is running 🚍");
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});



