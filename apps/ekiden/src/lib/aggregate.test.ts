import { describe, expect, it } from "vitest";
import { aggregate } from "./aggregate";
import type { Sighting } from "./types";

const NOW = Date.parse("2026-04-17T12:00:00.000Z");
const RACE = "00000000-0000-0000-0000-000000000000";
const DEVICE = "11111111-1111-1111-1111-111111111111";

let seq = 1;

function sighting(
  over: Partial<Sighting> & {
    lat: number;
    lng: number;
    secAgo: number;
  },
): Sighting {
  const { secAgo, ...rest } = over;
  return {
    id: seq++,
    race_id: RACE,
    bib: 1,
    accuracy: null,
    device_id: DEVICE,
    observed_at: new Date(NOW - secAgo * 1000).toISOString(),
    ...rest,
  };
}

describe("aggregate", () => {
  it("returns null for empty input", () => {
    expect(aggregate([], NOW)).toBeNull();
  });

  it("returns the single sighting as-is when only one is within window", () => {
    const result = aggregate(
      [sighting({ lat: 35.681, lng: 139.767, secAgo: 0 })],
      NOW,
    );
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(35.681, 6);
    expect(result!.lng).toBeCloseTo(139.767, 6);
    expect(result!.sampleCount).toBe(1);
    expect(result!.updatedAt).toBe(NOW);
  });

  it("excludes sightings older than the 120s window", () => {
    const result = aggregate(
      [sighting({ lat: 35.681, lng: 139.767, secAgo: 200 })],
      NOW,
    );
    expect(result).toBeNull();
  });

  it("weights newer sightings more heavily than older ones", () => {
    const result = aggregate(
      [
        sighting({ lat: 35.0, lng: 139.0, secAgo: 0 }),
        sighting({ lat: 36.0, lng: 140.0, secAgo: 60 }),
      ],
      NOW,
    );
    expect(result).not.toBeNull();
    // Pulls toward the newer point (35.0, 139.0), not the midpoint.
    expect(result!.lat).toBeLessThan(35.5);
    expect(result!.lat).toBeGreaterThan(35.0);
  });

  it("caps the contributing sample count at 10 newest", () => {
    const many: Sighting[] = [];
    for (let i = 0; i < 15; i++) {
      many.push(sighting({ lat: 35 + i * 0.0001, lng: 139, secAgo: i }));
    }
    const result = aggregate(many, NOW);
    expect(result).not.toBeNull();
    expect(result!.sampleCount).toBe(10);
    // updatedAt should be the newest (secAgo=0) sample.
    expect(result!.updatedAt).toBe(NOW);
  });

  it("removes far-away outliers when cluster dominates", () => {
    const cluster: Sighting[] = [];
    for (let i = 0; i < 8; i++) {
      cluster.push(
        sighting({
          lat: 35.6810 + (i % 3) * 0.0001,
          lng: 139.7670 + (i % 3) * 0.0001,
          secAgo: i + 1,
        }),
      );
    }
    const outlier = sighting({ lat: 36.0, lng: 140.0, secAgo: 0 });
    const result = aggregate([...cluster, outlier], NOW);
    expect(result).not.toBeNull();
    // Without outlier removal the centroid would be pulled noticeably east.
    // With removal it should stay inside the cluster.
    expect(result!.lat).toBeCloseTo(35.6811, 3);
    expect(result!.lng).toBeCloseTo(139.7671, 3);
    expect(result!.sampleCount).toBe(8);
  });

  it("does not apply outlier removal with fewer than 4 samples", () => {
    const result = aggregate(
      [
        sighting({ lat: 35.0, lng: 139.0, secAgo: 0 }),
        sighting({ lat: 36.0, lng: 140.0, secAgo: 0 }),
        sighting({ lat: 35.5, lng: 139.5, secAgo: 0 }),
      ],
      NOW,
    );
    expect(result).not.toBeNull();
    expect(result!.sampleCount).toBe(3);
  });

  it("gives more weight to sightings with tighter accuracy", () => {
    const result = aggregate(
      [
        sighting({ lat: 35.0, lng: 139.0, secAgo: 0, accuracy: 5 }),
        sighting({ lat: 36.0, lng: 140.0, secAgo: 0, accuracy: 100 }),
      ],
      NOW,
    );
    expect(result).not.toBeNull();
    // Accurate point dominates; result should be well under the midpoint.
    expect(result!.lat).toBeLessThan(35.1);
  });

  it("only includes sightings inside the time window in sampleCount", () => {
    const result = aggregate(
      [
        sighting({ lat: 35.0, lng: 139.0, secAgo: 10 }),
        sighting({ lat: 35.0, lng: 139.0, secAgo: 50 }),
        sighting({ lat: 35.0, lng: 139.0, secAgo: 300 }),
      ],
      NOW,
    );
    expect(result).not.toBeNull();
    expect(result!.sampleCount).toBe(2);
  });
});
