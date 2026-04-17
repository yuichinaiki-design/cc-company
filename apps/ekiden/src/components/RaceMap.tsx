"use client";
import dynamic from "next/dynamic";
import type { Positions } from "@/hooks/useSightings";

const ClientMap = dynamic(() => import("./RaceMap.client"), { ssr: false });

export default function RaceMap({ positions }: { positions: Positions }) {
  return <ClientMap positions={positions} />;
}
