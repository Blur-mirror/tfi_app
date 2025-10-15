// backend/src/services/arrivalService.ts
import axios from "axios";
import Redis from "ioredis";

const redis = new Redis(); // default: localhost:6379
const BASE_URL = process.env.TFI_BASE_URL || "https://api.nationaltransport.ie/gtfsr/v2/";
const API_KEY = process.env.TFI_API_KEY;

export async function getArrivalsForStop(stopId: string) {
  const cacheKey = "tripUpdatesCache";
  let tripData: any;

  try {
    // 1️⃣ Check if Redis is connected
    const redisStatus = redis.status;
    console.log(`🔌 Redis status: ${redisStatus}`);

    // 2️⃣ Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log("✅ Cache hit:", cacheKey);
      tripData = JSON.parse(cached);
    } else {
      console.log("🆕 Cache miss — fetching from TFI API...");
      const res = await axios.get(`${BASE_URL}TripUpdates?format=json`, {
        headers: { "x-api-key": API_KEY },
      });
      tripData = res.data;

      // Cache it
      await redis.setex(cacheKey, 30, JSON.stringify(tripData));
      console.log("💾 Cached data in Redis for 30s");
    }

    const entities = tripData?.entity || [];

    const arrivals = entities
      .filter((e: any) =>
        e.trip_update?.stop_time_update?.some((u: any) => u.stop_id === stopId)
      )
      .map((e: any) => ({
        trip_id: e.trip_update.trip.trip_id,
        route_id: e.trip_update.trip.route_id,
        stop_updates: e.trip_update.stop_time_update,
      }));

    return { arrivals };
  } catch (err: any) {
    console.error("⚠ Error fetching arrivals:", err.message);
    return { arrivals: [] };
  }
}
