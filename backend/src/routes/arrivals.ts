// backend/src/routes/arrivals.ts
import express from "express";
import { getArrivalsForStop } from "../services/arrivalService";

const router = express.Router();
console.log("✅ Arrivals route loaded"); 


/**
 * GET /api/arrivals/:stopId
 * Returns real-time arrivals for a given stop
 */
router.get("/:stopId", async (req, res) => {
  const { stopId } = req.params;

  try {
    const data = await getArrivalsForStop(stopId);
    if (!data || data.arrivals.length === 0) {
        return res.status(404).json({ error: "No arrivals found" });
      }
    res.json(data);
  } catch (err) {
    console.error("GET /api/arrivals/:stopId error:", err);
    res.status(500).json({ error: "Failed to fetch arrivals" });
  }
});

router.get("/", (req, res) => {
  res.json({ message: "Arrivals route works!" });
});


export { router as arrivalsRouter };
