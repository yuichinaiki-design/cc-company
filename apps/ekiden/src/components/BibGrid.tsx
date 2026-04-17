"use client";
import { useState } from "react";
import type { Runner } from "@/lib/types";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useDeviceId } from "@/hooks/useDeviceId";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Props = {
  raceId: string;
  runners: Runner[];
};

export default function BibGrid({ raceId, runners }: Props) {
  const { status, getOnce } = useGeolocation();
  const deviceId = useDeviceId();
  const [pending, setPending] = useState<Set<number>>(new Set());
  const [flash, setFlash] = useState<Map<number, "ok" | "err">>(new Map());
  const [error, setError] = useState<string | null>(null);

  async function report(bib: number) {
    if (!deviceId) return;
    setPending((s) => new Set(s).add(bib));
    setError(null);
    try {
      const fix = await getOnce();
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("sightings").insert({
        race_id: raceId,
        bib,
        lat: fix.lat,
        lng: fix.lng,
        accuracy: fix.accuracy,
        device_id: deviceId,
      });
      if (error) throw error;
      flashBib(bib, "ok");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "位置取得に失敗しました";
      setError(msg);
      flashBib(bib, "err");
    } finally {
      setPending((s) => {
        const n = new Set(s);
        n.delete(bib);
        return n;
      });
    }
  }

  function flashBib(bib: number, kind: "ok" | "err") {
    setFlash((m) => new Map(m).set(bib, kind));
    setTimeout(() => {
      setFlash((m) => {
        const n = new Map(m);
        n.delete(bib);
        return n;
      });
    }, 600);
  }

  return (
    <div className="bib-wrap">
      <div className="bib-status">
        <span>GPS: {statusLabel(status)}</span>
        {error && <span className="error small">{error}</span>}
      </div>
      <div className="bib-grid">
        {runners.map((r) => {
          const f = flash.get(r.bib);
          const cls = [
            "bib",
            pending.has(r.bib) ? "pending" : "",
            f === "ok" ? "ok" : "",
            f === "err" ? "err" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={r.bib}
              className={cls}
              onClick={() => report(r.bib)}
              disabled={pending.has(r.bib) || !deviceId}
              title={r.name ?? ""}
            >
              <span className="bib-num">{r.bib}</span>
              {r.name && <span className="bib-name">{r.name}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function statusLabel(s: string): string {
  switch (s) {
    case "granted":
      return "許可済み";
    case "denied":
      return "拒否";
    case "prompt":
      return "未許可";
    case "unsupported":
      return "非対応";
    default:
      return "確認中";
  }
}
