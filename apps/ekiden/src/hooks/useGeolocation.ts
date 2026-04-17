"use client";
import { useCallback, useEffect, useState } from "react";

export type GeoStatus = "unknown" | "granted" | "denied" | "prompt" | "unsupported";

export type GeoFix = {
  lat: number;
  lng: number;
  accuracy: number | null;
};

export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>("unknown");

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    const perms = (navigator as Navigator & {
      permissions?: {
        query: (d: { name: PermissionName }) => Promise<PermissionStatus>;
      };
    }).permissions;
    if (!perms) {
      setStatus("prompt");
      return;
    }
    perms
      .query({ name: "geolocation" as PermissionName })
      .then((p) => {
        setStatus(p.state as GeoStatus);
        p.onchange = () => setStatus(p.state as GeoStatus);
      })
      .catch(() => setStatus("prompt"));
  }, []);

  const getOnce = useCallback((): Promise<GeoFix> => {
    return new Promise((resolve, reject) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        reject(new Error("このブラウザは位置情報に対応していません"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setStatus("granted");
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy ?? null,
          });
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) setStatus("denied");
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
      );
    });
  }, []);

  return { status, getOnce };
}
