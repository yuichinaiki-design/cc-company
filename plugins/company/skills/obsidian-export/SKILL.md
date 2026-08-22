---
name: obsidian-export
description: >
  Claude に溜まった情報（.company/ の組織データ、CLAUDE.md メモリ、
  カスタムスキル、会話履歴）を Obsidian Vault にコピー・同期するスキル。
  「Obsidianにコピーして」「Obsidianにバックアップ」「Obsidianと同期」で発動する。
trigger: /obsidian-export
---

# Obsidian エクスポート

## いつ使うか

以下のような依頼を受けたとき:

- 「Obsidian に（Claude の情報を）コピーして / 移して / 入れて」
- 「Obsidian にバックアップして」「Obsidian と同期して」
- 「秘書のメモを Obsidian で読みたい」
- 「会話履歴を Obsidian に残したい」
- `/obsidian-export` が実行されたとき

## 何をコピーするか

| カテゴリ | ソース | 既定 |
|---------|-------|------|
| `company` | `./.company/`（秘書室の TODO・メモ・Inbox、各部署のファイル） | ✅ |
| `memory` | `~/.claude/CLAUDE.md`、プロジェクトの `CLAUDE.md`、`.claude/CLAUDE.md` | ✅ |
| `custom` | `~/.claude/` と `.claude/` の `skills/` `agents/` `commands/` | ✅ |
| `history` | `~/.claude/projects/**/*.jsonl` を Markdown 会話ログに変換 | ⬜️ 明示指定時のみ |

`history` は分量が多く、会話の生ログがそのまま Vault に残ります。
**ユーザーが明示的に希望した場合だけ** 含めること。

---

## ワークフロー

### Step 1: Vault のパスを確認する

`AskUserQuestion` で Obsidian Vault の場所を尋ねる。すでに `.company/CLAUDE.md` に
`obsidian-vault:` が記録されていれば、それを既定候補として提示する。

> Obsidian Vault の場所を教えてください。
>
> 例: `~/Documents/ObsidianVault`、`~/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyVault`

パスが存在しない場合はその場で指摘し、作成するか別のパスを使うかを確認する。
**Vault を勝手に新規作成しない。**

### Step 2: 対象カテゴリを確認する

`AskUserQuestion` で選ばせる（複数選択）。

- 組織データ（`.company/`）— 既定でオン
- メモリ（`CLAUDE.md`）— 既定でオン
- カスタム定義（skills / agents / commands）— 既定でオン
- 会話履歴（全セッションの生ログ）— 既定でオフ。**分量が多い旨を必ず伝える**

「全部」と言われた場合は 4 つすべて（`history` 込み）を対象にする。

### Step 3: ドライランで見せる

必ず `--dry-run` を先に実行し、**何件どこに書き込まれるか** をユーザーに提示する。

```bash
node <skill-dir>/scripts/export-to-obsidian.mjs \
  --vault "<VAULT_PATH>" \
  --dry-run
```

出力例:

```
[dry-run] Obsidian Vault: /Users/me/ObsidianVault
[dry-run] 出力先: Claude/
[dry-run]   組織データ（.company/）: 42 件
[dry-run]   メモリ（CLAUDE.md）: 2 件
[dry-run]   カスタム定義（skills / agents / commands）: 8 件
[dry-run] 新規 52 / 更新 0 / 変更なし 0 / 索引 4
```

内容を報告し、実行してよいか確認を取る。

### Step 4: 実行する

`--dry-run` を外して同じコマンドを実行する。

```bash
node <skill-dir>/scripts/export-to-obsidian.mjs --vault "<VAULT_PATH>"
```

会話履歴も含める場合は `--history` を足す。カテゴリを絞る場合は
`--include company,memory` のように指定する。

### Step 5: 結果を報告する

秘書の口調で、以下を伝える。

- 出力先（`<Vault>/Claude/`）と入口ノート（`000-Claude-MOC.md`）
- 新規 / 更新 / 変更なしの件数
- **衝突があった場合**: どのノートが手編集されていてスキップされたかを列挙し、
  「Vault 側の編集を残す（既定）」か「Claude 側で上書きする（`--force`）」かを尋ねる。
  ユーザーの確認なしに `--force` を実行しない。

### Step 6: Vault のパスを記録する（任意）

初回同期が成功したら、次回のために `.company/CLAUDE.md` の「運営ルール」配下へ追記してよいか尋ねる。

```markdown
### Obsidian 連携
- Vault: `<VAULT_PATH>`
- 出力先: `<Vault>/Claude/`
- 同期対象: company, memory, custom
- 最終同期: YYYY-MM-DD
```

以後は Step 1 でこの値を既定候補として使う。

---

## 生成される Vault の構成

```
<Vault>/Claude/
├── 000-Claude-MOC.md          ← 入口ノート（全カテゴリへのハブ）
├── company/
│   ├── 000-company-MOC.md
│   ├── CLAUDE.md
│   └── secretary/{todos,notes,inbox}/…
├── memory/
│   ├── 000-memory-MOC.md
│   ├── global-CLAUDE.md
│   └── <project>-CLAUDE.md
├── custom/
│   ├── 000-custom-MOC.md
│   └── {skills,agents,commands}/{global,project}/…
├── history/                    ← --history 指定時のみ
│   ├── 000-history-MOC.md
│   └── <project>/YYYY-MM-DD-<タイトル>-<id>.md
└── .sync/manifest.json         ← 同期状態（Obsidian からは不可視）
```

各ノートには frontmatter が付与される。

```yaml
---
claude-source: ".company/secretary/notes/competitor-research.md"
claude-origin: company
claude-synced: "2026-08-22T05:00:00.000Z"
tags: [claude, company, secretary]
---
```

元ファイルに frontmatter がある場合はそれを保ったまま `claude-*` を追加する。
元に `tags:` がある場合は上書きしない。

詳細は `references/vault-structure.md` を参照。

---

## コマンドリファレンス

```
node scripts/export-to-obsidian.mjs --vault <path> [options]

  --vault <path>       (必須) Obsidian Vault のルート
  --source <path>      .company/ を探すプロジェクトルート (default: カレント)
  --subfolder <name>   Vault 内の出力先 (default: Claude)
  --include <list>     company,memory,custom,history から選択
  --history            会話履歴も含める
  --claude-home <path> ~/.claude の場所 (default: $CLAUDE_CONFIG_DIR or ~/.claude)
  --dry-run            書き込まずに計画だけ表示
  --force              手編集されたノートも上書き
  --json               サマリを JSON 出力
```

Node.js 18 以上が必要（依存パッケージなし）。

---

## 重要な注意事項

- **必ず `--dry-run` を先に実行**し、結果を報告してから本実行する
- **Vault のファイルは削除されない**。追加と更新のみ
- **手編集されたノートは上書きされない**。衝突として報告され、`--force` を付けたときだけ上書きされる。
  `--force` はユーザーが明示的に承認した場合のみ使う
- **会話履歴は既定で含めない**。生ログには機微な情報が含まれうるため、必ず確認を取る
- Vault が共有フォルダ（iCloud / Dropbox / Git 同期）にある場合、同期先に情報が渡ることを一言添える
- 同期は冪等。同じ内容なら再実行しても書き込まれない（`000-Claude-MOC.md` の同期日時のみ更新される）
- Vault が見つからないときは新規作成せず、パスを確認し直す
