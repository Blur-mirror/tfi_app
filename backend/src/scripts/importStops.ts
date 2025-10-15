import fs from "fs";
import csv from "csv-parser";
import { db, pgp } from "../db"; 

(async () => {
    try {
        // --- 1. CREATE TABLE: Includes the stop_code column ---
        await db.none(`
            CREATE TABLE IF NOT EXISTS stops (
                stop_id VARCHAR PRIMARY KEY,
                stop_code VARCHAR,
                stop_name TEXT,
                stop_lat DOUBLE PRECISION,
                stop_lon DOUBLE PRECISION
            );
        `);

        const results: any[] = [];
        // --- 2. Read the stops.txt CSV file ---
        fs.createReadStream("data/stops.txt") 
            .pipe(csv())
            .on("data", (row) => {
                // --- 3. MAPPING: Correctly mapping all necessary columns, including stop_code ---
                results.push({
                    stop_id: row.stop_id,
                    stop_code: row.stop_code, 
                    stop_name: row.stop_name,
                    // Parse coordinates to ensure they are inserted as numbers (DOUBLE PRECISION)
                    stop_lat: parseFloat(row.stop_lat),
                    stop_lon: parseFloat(row.stop_lon),
                });
            })
            .on("end", async () => {
                if (results.length === 0) {
                    console.warn("⚠️ No rows found in stops.txt — check file path");
                    process.exit(1);
                }

                // --- 4. INSERTION: Including stop_code in the target column list ---
                const insertQuery = pgp.helpers.insert(
                    results,
                    ["stop_id", "stop_code", "stop_name", "stop_lat", "stop_lon"],
                    "stops" // Target table name
                );
                
                await db.none(insertQuery);
                console.log(`✅ Successfully imported ${results.length} stops, including stop codes.`);
                process.exit(0);
            });
    } catch (err) {
        console.error("❌ Import failed:", err);
        process.exit(1);
    }
})();