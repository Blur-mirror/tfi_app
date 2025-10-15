import Redis from "ioredis";
import fetch from "node-fetch";
import { db } from "../db";

const redis = new Redis(); // assumes redis://localhost:6379

// Fetches GTFS-Realtime feed, caches it for 30 seconds
export async function getRealtimeFeed(): Promise<any> {
  const cacheKey = "gtfs_feed";
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const url = "https://api.nationaltransport.ie/gtfsr/v2/gtfs-realtime?format=protobuf";
  const headers = { "x-api-key": process.env.TFI_API_KEY! };

  const resp = await fetch(url, { headers });
  const buffer = await resp.arrayBuffer();

  // use gtfs-realtime-bindings to decode the protobuf
  const GtfsRealtimeBindings = await import("gtfs-realtime-bindings");
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
    new Uint8Array(buffer)
  );

  await redis.set(cacheKey, JSON.stringify(feed), "EX", 30);
  return feed;
}
