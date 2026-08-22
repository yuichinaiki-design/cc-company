# Obsidian バックアップ

`.company/` に溜まった組織の記録や、Claude のメモリ・会話履歴を Obsidian Vault にコピーします。
Claude Code の外でも読み返せて、リンクや検索、Dataview がそのまま使えます。

## 使い方

```
> Obsidian にバックアップして

秘書: Obsidian Vault の場所を教えてください。
あなた: ~/Documents/ObsidianVault

秘書: 何をコピーしますか？
      ☑ 組織データ（.company/）
      ☑ メモリ（CLAUDE.md）
      ☑ カスタム定義（skills / agents / commands）
      ☐ 会話履歴（分量が多いです）

→ まずドライランで件数を確認 → 実行
```

「Obsidianにコピー」「Obsidianと同期」でも同じスキルが動きます。

## コピーされるもの

| カテゴリ | ソース | 既定 |
|---------|-------|------|
| 組織データ | `./.company/`（TODO・メモ・Inbox・各部署） | ✅ |
| メモリ | `~/.claude/CLAUDE.md`、プロジェクトの `CLAUDE.md` | ✅ |
| カスタム定義 | `~/.claude/` と `.claude/` の `skills` `agents` `commands` | ✅ |
| 会話履歴 | `~/.claude/projects/**/*.jsonl` を Markdown に変換 | ⬜️ 指定時のみ |

会話履歴は生ログなので既定ではオフです。含めるかどうかは毎回確認されます。

## Vault の構成

```
<Vault>/Claude/
├── 000-Claude-MOC.md          ← ここから辿る
├── company/
│   ├── 000-company-MOC.md
│   └── secretary/{todos,notes,inbox}/…
├── memory/
├── custom/
└── history/                    ← 会話履歴を含めた場合のみ
```

各ノートには frontmatter が付きます。

```yaml
---
claude-source: ".company/secretary/notes/competitor-research.md"
claude-origin: company
claude-synced: "2026-08-22T05:00:00.000Z"
tags: [claude, company, secretary]
---
```

元ファイルに frontmatter があればそれを保ったまま追加されます。
元の `tags:` は上書きしません。

### Dataview の例

```dataview
TABLE claude-source AS "元ファイル", claude-synced AS "同期"
FROM "Claude/company"
WHERE claude-origin = "company"
SORT file.name DESC
```

## 安全のしくみ

- **削除しません**。Vault へは追加と更新だけ。ソース側で消したファイルも Vault には残ります
- **手編集を上書きしません**。Vault 側で書き足したノートは「衝突」として報告され、
  承認して `--force` を付けたときだけ上書きされます
- **冪等です**。内容が変わっていなければ再実行しても書き込まれません
- **必ずドライランが先**に走り、何件どこに書かれるかを確認してから実行します

## 手動で実行する

スキルを介さず直接叩くこともできます。

```bash
node ~/.claude/plugins/company/skills/obsidian-export/scripts/export-to-obsidian.mjs \
  --vault ~/Documents/ObsidianVault \
  --dry-run
```

| オプション | 説明 |
|-----------|------|
| `--vault <path>` | （必須）Obsidian Vault のルート |
| `--source <path>` | `.company/` を探すプロジェクトルート（既定: カレント） |
| `--subfolder <name>` | Vault 内の出力先（既定: `Claude`） |
| `--include <list>` | `company,memory,custom,history` から選択 |
| `--history` | 会話履歴も含める |
| `--dry-run` | 書き込まずに計画だけ表示 |
| `--force` | 手編集されたノートも上書き |
| `--json` | サマリを JSON で出力 |

Node.js 18 以上が必要です（依存パッケージはありません）。

## 定期バックアップにする

cron や launchd から `--json` 付きで回すとログが取りやすくなります。

```bash
0 22 * * * cd ~/work/myproject && node ~/.claude/plugins/company/skills/obsidian-export/scripts/export-to-obsidian.mjs --vault ~/Documents/ObsidianVault --json >> ~/obsidian-sync.log 2>&1
```

## 複数プロジェクトをまとめる

プロジェクトごとに `--source` と `--subfolder` を変えて実行すると混ざりません。

```bash
node export-to-obsidian.mjs --vault ~/Vault --source ~/work/a --subfolder "Claude/a"
node export-to-obsidian.mjs --vault ~/Vault --source ~/work/b --subfolder "Claude/b"
```

## 注意

- Vault が iCloud / Dropbox / Git などで同期されている場合、コピーした情報もその同期先に渡ります
- Vault 側でノートをリネームしても追跡されません。再同期すると元の名前で作り直されます
- `.md` 以外のテキスト（`.json` `.yaml` など）はコードブロックに包まれて `.md` として保存されます
