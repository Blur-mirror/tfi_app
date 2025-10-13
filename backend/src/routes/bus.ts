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
    // Construct TFI API endpoint - v2 uses TripUpdates
    const url = `${process.env.TFI_BASE_URL}TripUpdates?format=json`;
    
    // Debug logging
    console.log("🔍 Attempting to fetch from URL:", url);
    console.log("🔑 API Key present:", !!process.env.TFI_API_KEY);
    console.log("🔑 API Key length:", process.env.TFI_API_KEY?.length);

    const response = await axios.get(url, {
      headers: { "x-api-key": process.env.TFI_API_KEY },
    });

    console.log("✅ Successfully fetched data, status:", response.status);

    // The API returns all vehicles — we'll just return it raw for now
    const data = response.data;

    res.json({
      stopId,
      message: "Fetched data from TFI successfully!",
      data,
    });
  } catch (error: any) {
    console.error("❌ TFI API error:", error.message);
    console.error("❌ Error response status:", error.response?.status);
    console.error("❌ Error response data:", error.response?.data);
    console.error("❌ Full error:", error);
    
    res.status(500).json({ 
      error: "Failed to fetch bus data",
      details: error.response?.data || error.message 
    });
  }
});

export { router as busRouter };