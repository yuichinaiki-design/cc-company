"use client";
import { use, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Row = { race_id: string; bib: number; name: string | null; team: string | null };

function parse(text: string, raceId: string): Row[] {
  const rows: Row[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const [bibStr, name, team] = line.split(",").map((x) => x?.trim() ?? "");
    const bib = Number(bibStr);
    if (!Number.isInteger(bib)) continue;
    rows.push({
      race_id: raceId,
      bib,
      name: name || null,
      team: team || null,
    });
  }
  return rows;
}

export default function AdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [text, setText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const rows = parse(text, id);
    if (rows.length === 0) {
      setError("`ゼッケン,名前,チーム` の形式で 1 行以上入力してください。");
      setBusy(false);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("runners").upsert(rows);
    if (error) setError(error.message);
    else {
      setMessage(`${rows.length} 件を登録しました。`);
      setText("");
    }
    setBusy(false);
  }

  return (
    <main className="container">
      <p>
        <Link href={`/race/${id}`}>← レースに戻る</Link>
      </p>
      <h1>ランナー一括登録</h1>
      <p className="muted">
        1 行 1 ランナー。形式: <code>ゼッケン,名前,チーム</code>（名前・チームは省略可）。
      </p>
      <form onSubmit={submit}>
        <textarea
          rows={12}
          placeholder={"1,田中,A高校\n2,鈴木,A高校\n3,,B高校"}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" disabled={busy}>
          {busy ? "登録中…" : "登録"}
        </button>
      </form>
      {message && <p className="ok">{message}</p>}
      {error && <p className="error">{error}</p>}
    </main>
  );
}
