// backend/src/routes/stops.ts
import express from "express";
import { db } from "../db"; // db exported from src/db.ts (pg-promise)
import { findStopsByQuery } from "../services/stopLookup";


const router = express.Router();

router.get("/find", async (req, res) => {
  const q = String(req.query.q || "");
  try {
    const results = await findStopsByQuery(q, 20);
    res.json({ query: q, results });
  } catch (err) {
    console.error("stop find error:", err);
    res.status(500).json({ error: "Failed to find stops" });
  }
});

export { router as findStopsRouter };

// -------------------------------------------------------------------
// 1. GET /api/stops?query=...&limit=10 (Stop Search with Apostrophe Fix)
// -------------------------------------------------------------------
router.get("/", async (req, res) => {
  // Destructure query and limit from query parameters (with defaults)
  const { query, limit = 10 } = req.query;

  // 💡 FIX: Normalize the user's query by removing apostrophes 
  // This allows searching for "OConnell" even if the DB has "O'Connell".
  const normalizedQuery = (query as string || "")
      .replace(/['’]/g, '') // Removes ' and right single quotation mark ’
      .trim();
  
  // The search term the SQL will use, e.g., "%OConnell%"
  const searchString = `%${normalizedQuery}%`;

  try {
      const stops = await db.manyOrNone(
          // 💡 NEW SQL: Use PostgreSQL's REPLACE function to temporarily remove 
          // apostrophes from the database 'stop_name' column for comparison.
          `
          SELECT 
              stop_id, 
              stop_name, 
              stop_lat, 
              stop_lon 
          FROM 
              stops 
          WHERE 
              REPLACE(stop_name, '''', '') ILIKE $1 
          ORDER BY 
              stop_name 
          LIMIT $2
          `,
          [searchString, limit]
      );
      
      res.json(stops);
  } catch (err) {
      console.error("Stop Search Error:", err);
      res.status(500).json({ error: "Failed to fetch stops by query" });
  }
});
/**
 * GET /api/stops/near
 * Query by lat/lon: /api/stops/near?lat=53.3498&lon=-6.2603&radius_m=500&limit=20
 * Uses PostGIS if geom exists, otherwise uses simple squared-distance approximation.
 */
router.get("/near", async (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  const radius = Number(req.query.radius_m || 500); // meters
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return res.status(400).json({ error: "lat and lon are required numeric query params" });
  }

  try {
    // Try PostGIS query first (if geom column exists)
    const hasGeom = await db.oneOrNone(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name='stops' AND column_name='geom'`
    );

    if (hasGeom) {
      // Use geography distance (meters)
      const rows = await db.manyOrNone(
        `SELECT stop_id, stop_name, stop_lat, stop_lon,
                ST_Distance(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_m
         FROM stops
         WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
         ORDER BY distance_m
         LIMIT $4`,
        [lon, lat, radius, limit]
      );
      return res.json({ count: rows.length, stops: rows });
    } else {
      // Fallback: simple approximate distance using lat/lon (works for small areas)
      const rows = await db.manyOrNone(
        `SELECT stop_id, stop_name, stop_lat, stop_lon,
                ((stop_lat - $1)*(stop_lat - $1) + (stop_lon - $2)*(stop_lon - $2)) AS dist_approx
         FROM stops
         ORDER BY dist_approx
         LIMIT $3`,
        [lat, lon, limit]
      );
      return res.json({ count: rows.length, stops: rows });
    }
  } catch (err) {
    console.error("GET /api/stops/near error:", err);
    res.status(500).json({ error: "Failed to query nearby stops" });
  }
});

/**
 * GET /api/stops/:stopId
 * Returns one stop by id
 */
router.get("/:stopId", async (req, res) => {
  const { stopId } = req.params;
  try {
    const row = await db.oneOrNone(
      `SELECT stop_id, stop_name, stop_lat, stop_lon FROM stops WHERE stop_id = $1`,
      [stopId]
    );
    if (!row) return res.status(404).json({ error: "Stop not found" });
    res.json(row);
  } catch (err) {
    console.error("GET /api/stops/:stopId error:", err);
    res.status(500).json({ error: "Failed to fetch stop" });
  }
});

export { router as stopsRouter };

