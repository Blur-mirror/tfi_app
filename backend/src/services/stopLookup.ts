// backend/src/services/stopLookup.ts
import { db } from "../db";

/**
 * Find stops by a user-provided identifier (could be stop_id, stop_code, partial digits, or name).
 * Returns prioritized results; first try exact authoritative matches then fallbacks.
 *
 * Behavior:
 * - if input looks like a full stop_id (letters+digits or long) -> try exact
 * - if numeric and short -> try stop_code, then suffix match on stop_id
 * - if alpha (contains letters) -> search stop_name
 */
export async function findStopsByQuery(q: string, limit = 10) {
  const clean = String(q).trim();
  if (!clean) return [];

  // helper: numeric-only?
  const isNumeric = /^[0-9]+$/.test(clean);
  // helper: plausible full id (contains letters OR long length)
  const isLikelyFullId = /[A-Za-z]/.test(clean) || clean.length > 6;

  // 1) If looks like full stop_id -> exact match
  if (isLikelyFullId) {
    const exact = await db.oneOrNone(
      `SELECT stop_id, stop_code, stop_name, stop_lat, stop_lon FROM stops WHERE stop_id = $1`,
      [clean]
    );
    if (exact) return [exact];
    // also try case-insensitive contains if exact didn't match
    const contains = await db.manyOrNone(
      `SELECT stop_id, stop_code, stop_name, stop_lat, stop_lon
       FROM stops WHERE stop_id ILIKE $1 LIMIT $2`,
      [`%${clean}%`, limit]
    );
    if (contains.length) return contains;
  }

  // 2) If numeric (likely user typed short code displayed on stop), try exact stop_code
  if (isNumeric) {
    // exact stop_code match
    const byCode = await db.manyOrNone(
      `SELECT stop_id, stop_code, stop_name, stop_lat, stop_lon
       FROM stops WHERE stop_code = $1 LIMIT $2`,
      [clean, limit]
    );
    if (byCode.length) return byCode;

    // suffix match: last N digits of stop_id equal the input
    // RIGHT(stop_id, length) = clean
    const suffix = await db.manyOrNone(
      `SELECT stop_id, stop_code, stop_name, stop_lat, stop_lon
       FROM stops
       WHERE RIGHT(stop_id, $1) = $2
       LIMIT $3`,
      [clean.length, clean, limit]
    );
    if (suffix.length) return suffix;

    // fallback: stop_id LIKE '%{clean}%'
    const likeMatches = await db.manyOrNone(
      `SELECT stop_id, stop_code, stop_name, stop_lat, stop_lon
       FROM stops
       WHERE stop_id ILIKE $1
       LIMIT $2`,
      [`%${clean}%`, limit]
    );
    if (likeMatches.length) return likeMatches;
  }

  // 3) If not numeric or earlier lookups failed: search by name (case-insensitive, partial)
  const nameMatches = await db.manyOrNone(
    `SELECT stop_id, stop_code, stop_name, stop_lat, stop_lon
     FROM stops
     WHERE stop_name ILIKE $1
     ORDER BY stop_name
     LIMIT $2`,
    [`%${clean}%`, limit]
  );
  if (nameMatches.length) return nameMatches;

  // 4) Final fallback: fuzzy search on stop_id / stop_name (using pg_trgm)
  const fuzzy = await db.manyOrNone(
    `SELECT stop_id, stop_code, stop_name, stop_lat, stop_lon
     FROM stops
     WHERE stop_id % $1 OR stop_name % $1
     LIMIT $2`,
    [clean, limit]
  );

  return fuzzy;
}
