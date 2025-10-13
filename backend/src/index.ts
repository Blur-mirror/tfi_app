import express from "express";
import dotenv from "dotenv";
import { router as healthRouter } from"./routes/health";

// Load environment variables from .env file
dotenv.config();

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Example route
app.use("/api/health", healthRouter);

// Define the port (from .env or default)
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
