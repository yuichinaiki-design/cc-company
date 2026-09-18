import {
  AGG_MAX_SAMPLES,
  AGG_MIN_SAMPLES_FOR_OUTLIER,
  AGG_OUTLIER_STDDEV,
  AGG_WEIGHT_K,
  AGG_WINDOW_SECONDS,
} from "./constants";
import type { Position, Sighting } from "./types";

const METERS_PER_DEG_LAT = 111_320;

function metersBetween(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const meanLat = ((aLat + bLat) / 2) * (Math.PI / 180);
  const dx = (aLng - bLng) * Math.cos(meanLat) * METERS_PER_DEG_LAT;
  const dy = (aLat - bLat) * METERS_PER_DEG_LAT;
  return Math.sqrt(dx * dx + dy * dy);
}

export function aggregate(
  sightings: readonly Sighting[],
  now: number = Date.now(),
): Position | null {
  if (sightings.length === 0) return null;

  const cutoff = now - AGG_WINDOW_SECONDS * 1000;
  const recent = sightings
    .map((s) => ({ ...s, t: Date.parse(s.observed_at) }))
    .filter((s) => s.t >= cutoff)
    .sort((a, b) => b.t - a.t)
    .slice(0, AGG_MAX_SAMPLES);

  if (recent.length === 0) return null;

  const meanLat = recent.reduce((a, s) => a + s.lat, 0) / recent.length;
  const meanLng = recent.reduce((a, s) => a + s.lng, 0) / recent.length;

  let pool = recent;
  if (recent.length >= AGG_MIN_SAMPLES_FOR_OUTLIER) {
    const dists = recent.map((s) =>
      metersBetween(s.lat, s.lng, meanLat, meanLng),
    );
    const mean = dists.reduce((a, d) => a + d, 0) / dists.length;
    const variance =
      dists.reduce((a, d) => a + (d - mean) ** 2, 0) / dists.length;
    const stddev = Math.sqrt(variance);
    const threshold = mean + AGG_OUTLIER_STDDEV * stddev;
    pool = recent.filter((_, i) => dists[i] <= threshold);
    if (pool.length < 2) pool = recent;
  }

  let wSum = 0;
  let wLat = 0;
  let wLng = 0;
  for (const s of pool) {
    const ageSec = Math.max(0, (now - s.t) / 1000);
    let w = 1 / (ageSec + AGG_WEIGHT_K);
    if (s.accuracy != null) {
      w /= Math.max(s.accuracy, 5);
    }
    wSum += w;
    wLat += s.lat * w;
    wLng += s.lng * w;
  }
  if (wSum === 0) return null;

  const newest = pool[0].t;
  return {
    lat: wLat / wSum,
    lng: wLng / wSum,
    updatedAt: newest,
    sampleCount: pool.length,
  };
}
