// backend/src/routes/bus.ts
import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// GET /api/bus/:stopId
router.get("/:stopId", async (req, res) => {
  const { stopId } = req.params;

  try {
    // Construct TFI API endpoint
    const url = `${process.env.TFI_BASE_URL}gtfs-realtime?format=json`;

    const response = await axios.get(url, {
      headers: { "x-api-key": process.env.TFI_API_KEY },
    });

    // The API returns all vehicles — we’ll just return it raw for now
    const data = response.data;

    res.json({
      stopId,
      message: "Fetched data from TFI successfully!",
      data,
    });
  } catch (error: any) {
    console.error("TFI API error:", error.message);
    res.status(500).json({ error: "Failed to fetch bus data" });
  }
});

export { router as busRouter };
