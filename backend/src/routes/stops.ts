import express from "express";
import { db } from "../db";

const router = express.Router();

// GET /api/stops?query=drumcondra
router.get("/", async (req, res) => {
  const { query } = req.query;
  try {
    const stops = await db.manyOrNone(
      "SELECT * FROM stops WHERE stop_name ILIKE $1 LIMIT 10",
      [`%${query || ""}%`]
    );
    res.json(stops);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stops" });
  }
});

export { router as stopsRouter };
