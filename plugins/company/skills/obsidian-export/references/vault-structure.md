# Vault 構成リファレンス

`export-to-obsidian.mjs` が Obsidian Vault に作る構造と、その設計判断のまとめ。

---

## 1. ディレクトリ構成

出力先は `<Vault>/<subfolder>/`（既定 `Claude`）。Vault の既存フォルダには触れない。

```
<Vault>/Claude/
├── 000-Claude-MOC.md            入口ノート
├── company/
│   ├── 000-company-MOC.md
│   └── (.company/ の構造をそのままミラー)
├── memory/
│   ├── 000-memory-MOC.md
│   ├── global-CLAUDE.md         ~/.claude/CLAUDE.md
│   ├── <project>-CLAUDE.md      <project>/CLAUDE.md
│   └── <project>-local-CLAUDE.md  <project>/.claude/CLAUDE.md
├── custom/
│   ├── 000-custom-MOC.md
│   ├── skills/{global,project}/…
│   ├── agents/{global,project}/…
│   └── commands/{global,project}/…
├── history/
│   ├── 000-history-MOC.md
│   └── <project-key>/YYYY-MM-DD-<title>-<sid8>.md
└── .sync/
    └── manifest.json
```

`000-` 接頭辞は Obsidian のファイル一覧で索引を先頭に固定するため。
`.sync/` はドットフォルダなので Obsidian のファイルエクスプローラには現れない。

---

## 2. ファイル種別ごとの扱い

| 拡張子 | 変換 |
|-------|------|
| `.md` / `.markdown` | frontmatter をマージしてそのままコピー |
| `.txt` `.json` `.yaml` `.yml` `.csv` `.toml` | コードブロックで包み `<name>.<ext>.md` として保存 |
| その他（画像など） | バイナリのままコピー。frontmatter なし、MOC にも載せない |

5MB を超えるファイルはスキップし、警告として報告する。
`.git` `node_modules` `.obsidian` `.sync` は走査対象外。

---

## 3. frontmatter

生成されるノートには次のキーが付く。

```yaml
claude-source: ".company/secretary/notes/foo.md"   # 元ファイルのパス
claude-origin: company                             # company | memory | custom | history | moc
claude-synced: "2026-08-22T05:00:00.000Z"          # 最終同期時刻 (UTC)
tags: [claude, company, secretary]                 # 元に tags がない場合のみ付与
```

**マージ規則**

- 元ファイルの frontmatter は行単位で保持する
- 元にあった `claude-*` 行は取り除いてから再生成する（重複防止）
- 元に `tags:` がある場合は**触らない**。ユーザーの分類を壊さないため
- 元に frontmatter がない場合は新規に作る

### Dataview で使う例

```dataview
TABLE claude-source AS "元ファイル", claude-synced AS "同期"
FROM "Claude/company"
WHERE claude-origin = "company"
SORT file.name DESC
```

---

## 4. MOC（索引ノート）

- `000-Claude-MOC.md` — カテゴリ一覧、同期のしくみ、ソースのパス、最終同期日時
- `000-<category>-MOC.md` — そのカテゴリのノートをフォルダ別にグルーピングしたリンク集

Wikilink は Vault ルート相対のフルパス形式で書く。

```markdown
[[Claude/company/secretary/todos/2026-08-22]]
```

ファイル名だけの `[[2026-08-22]]` にしないのは、`todos/` と `inbox/` で
同じ日付のファイル名が衝突するため。

カテゴリ MOC には**タイムスタンプを入れない**。内容が変わったときだけ書き換わるようにして、
毎回の差分ノイズを避けている。同期日時は `000-Claude-MOC.md` にだけ入る。

---

## 5. 同期のセマンティクス

`.sync/manifest.json` に、ファイルごとに 2 つのハッシュを記録する。

```json
{
  "version": 1,
  "files": {
    "Claude/company/secretary/notes/foo.md": {
      "sourceHash": "a1b2c3d4e5f60718",
      "vaultHash": "0f1e2d3c4b5a6978",
      "syncedAt": "2026-08-22T05:00:00.000Z"
    }
  }
}
```

- `sourceHash` — 同期時点のソースファイルの内容ハッシュ
- `vaultHash` — 書き出した Vault ファイルの内容ハッシュ

再同期時の判定:

| Vault の現在のハッシュ | ソースのハッシュ | 動作 |
|---------------------|----------------|------|
| `vaultHash` と一致 | `sourceHash` と一致 | **スキップ**（変更なし） |
| `vaultHash` と一致 | 変わっている | **更新**（Claude 側の変更を反映） |
| `vaultHash` と不一致（手編集） | — | **衝突**として報告しスキップ。`--force` でのみ上書き |
| ファイルが存在しない | — | **新規作成** |

**削除は一切しない。** ソース側で消えたファイルも Vault には残る。
バックアップとして使う前提のため、消し込みはユーザーの手に委ねる。

manifest が壊れている・存在しない場合は空の状態から作り直す。
このとき既存の Vault ファイルはすべて「手編集」と判定され衝突になるので、
初回同期をやり直す場合は `--force` を使う。

---

## 6. 会話履歴の変換

`~/.claude/projects/<project-key>/<session-uuid>.jsonl` の各行から
`type` が `user` / `assistant` のものだけを拾い、Markdown に整形する。

- `isSidechain: true`（サブエージェントの内部やりとり）は除外
- `thinking` ブロックは記録しない
- `tool_use` ブロックは `> 🔧 **Bash** を実行` の 1 行に要約する
- `tool_result` は保存しない（分量が支配的で、本文の可読性を損なうため）
- ファイル名は `YYYY-MM-DD-<最初のユーザー発話 60 文字>-<セッションID 先頭 8 桁>.md`

本文のないターン（thinking のみ、ツール結果のみ）は落とす。
結果として残るのは「人が読み返す価値のある会話の流れ」になる。

---

## 7. 既知の制約

- ソース側の削除は Vault に反映されない（設計上の意図）
- `.md` 以外のテキストはコードブロック化されるため、Obsidian のリンク解決対象にならない
- 複数プロジェクトの `.company/` をまとめるには、プロジェクトごとに `--source` を変えて実行する
  （`--subfolder Claude/<project>` で出力先を分けると混ざらない）
- Vault 側のリネームは追跡できない。リネーム後に再同期すると元の名前で再作成される
