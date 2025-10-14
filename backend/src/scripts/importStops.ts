import fs from "fs";
import csv from "csv-parser";
import { db, pgp } from "../db"; 

(async () => {
  try {
    await db.none(`
      CREATE TABLE IF NOT EXISTS stops (
        stop_id VARCHAR PRIMARY KEY,
        stop_name TEXT,
        stop_lat DOUBLE PRECISION,
        stop_lon DOUBLE PRECISION
      );
    `);

    const results: any[] = [];
    fs.createReadStream("data/stops.txt") 
      .pipe(csv())
      .on("data", (row) => {
        results.push({
          stop_id: row.stop_id,
          stop_name: row.stop_name,
          stop_lat: parseFloat(row.stop_lat),
          stop_lon: parseFloat(row.stop_lon),
        });
      })
      .on("end", async () => {
        if (results.length === 0) {
          console.warn("⚠️ No rows found in stops.txt — check file path");
          process.exit(1);
        }

        const insertQuery = pgp.helpers.insert(
          results,
          ["stop_id", "stop_name", "stop_lat", "stop_lon"],
          "stops"
        );
        await db.none(insertQuery);
        console.log(`✅ Imported ${results.length} stops`);
        process.exit(0);
      });
  } catch (err) {
    console.error("❌ Import failed:", err);
    process.exit(1);
  }
})();
