"use client";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { DEVICE_ID_STORAGE_KEY } from "@/lib/constants";

export function useDeviceId(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    let stored = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (!stored) {
      stored = uuidv4();
      localStorage.setItem(DEVICE_ID_STORAGE_KEY, stored);
    }
    setId(stored);
  }, []);
  return id;
}
