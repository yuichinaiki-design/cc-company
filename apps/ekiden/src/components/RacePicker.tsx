"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Race } from "@/lib/types";

export default function RacePicker() {
  const [races, setRaces] = useState<Race[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase
      .from("races")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setRaces((data as Race[]) ?? []);
        setLoading(false);
      });
  }, []);

  async function createRace(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("races")
      .insert({ name: n })
      .select()
      .single();
    if (error) {
      setError(error.message);
      return;
    }
    setRaces((cur) => [data as Race, ...cur]);
    setName("");
  }

  return (
    <main className="container">
      <h1>駅伝盛り上げ</h1>
      <p className="muted">沿道から選手のゼッケンをタップして位置を共有しよう。</p>

      <form onSubmit={createRace} className="row">
        <input
          type="text"
          placeholder="新しいレース名"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" disabled={!name.trim()}>
          レース作成
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <h2>レース一覧</h2>
      {loading ? (
        <p>読み込み中…</p>
      ) : races.length === 0 ? (
        <p className="muted">まだレースがありません。上から作成してください。</p>
      ) : (
        <ul className="list">
          {races.map((r) => (
            <li key={r.id}>
              <Link href={`/race/${r.id}`}>{r.name}</Link>
              <Link href={`/race/${r.id}/admin`} className="muted small">
                ランナー管理
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
