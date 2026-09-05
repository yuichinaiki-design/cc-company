# 部署一覧

各部署の詳細と、追加時に生成されるフォルダ構成です。

## 秘書室（常設）

窓口・相談役。初回セットアップで自動作成されます。

**担当:** TODO管理、壁打ち、メモ、相談、ダッシュボード

```
secretary/
├── CLAUDE.md
├── inbox/          ← クイックキャプチャ（迷ったらここ）
├── todos/          ← 日次タスク管理（1日1ファイル）
│   └── YYYY-MM-DD.md
└── notes/          ← 壁打ちメモ・意思決定ログ
```

**ファイル命名:**
- TODO: `todos/YYYY-MM-DD.md`
- Inbox: `inbox/YYYY-MM-DD.md`
- メモ: `notes/kebab-case-topic.md`
- 意思決定: `notes/YYYY-MM-DD-decisions.md`

---

## PM（プロジェクト管理）

**担当:** プロジェクト進捗、マイルストーン、チケット管理

```
pm/
├── CLAUDE.md
├── projects/       ← 1プロジェクト1ファイル
└── tickets/        ← 1チケット1ファイル
```

**ステータス:**
- プロジェクト: `planning` → `in-progress` → `review` → `completed` → `archived`
- チケット: `open` → `in-progress` → `done`

---

## リサーチ

**担当:** 市場調査、競合分析、技術調査

```
research/
├── CLAUDE.md
└── topics/         ← 1トピック1ファイル
```

**ステータス:** `planning` → `in-progress` → `completed`

---

## マーケティング

**担当:** コンテンツ企画、SNS戦略、キャンペーン管理

```
marketing/
├── CLAUDE.md
├── content-plan/   ← 1コンテンツ1ファイル
└── campaigns/      ← 1キャンペーン1ファイル
```

**ステータス:**
- コンテンツ: `draft` → `writing` → `review` → `published`
- キャンペーン: `planning` → `active` → `completed` → `reviewed`

---

## 開発

**担当:** 技術ドキュメント、設計書、デバッグログ

```
engineering/
├── CLAUDE.md
├── docs/           ← 技術ドキュメント・設計書
└── debug-log/      ← バグ調査ログ
```

**ステータス（デバッグ）:** `open` → `investigating` → `resolved` → `closed`

---

## 経理

**担当:** 請求書、経費、売上管理

```
finance/
├── CLAUDE.md
├── invoices/       ← 1請求1ファイル
└── expenses/       ← 月別またはカテゴリ別
```

**ステータス（請求書）:** `draft` → `sent` → `paid` → `overdue`

---

## 営業

**担当:** クライアント管理、提案書、案件パイプライン

```
sales/
├── CLAUDE.md
├── clients/        ← 1クライアント1ファイル
└── proposals/      ← 1提案1ファイル
```

**ステータス:**
- クライアント: `prospect` → `active` → `inactive`
- 提案書: `draft` → `sent` → `accepted` → `rejected`

---

## クリエイティブ

**担当:** デザインブリーフ、ブランド管理、アセット管理

```
creative/
├── CLAUDE.md
├── briefs/         ← 1案件1ファイル
└── assets/         ← アセット一覧
```

**ステータス:** `draft` → `approved` → `in-production` → `delivered`

---

## 人事

**担当:** 採用管理、オンボーディング、チーム管理

```
hr/
├── CLAUDE.md
└── hiring/         ← 1ポジション1ファイル
```

**ステータス:** `open` → `screening` → `interviewing` → `offered` → `filled` → `closed`

---

## アフィリエイト運営

**担当:** 商品リサーチ、記事執筆、導線設置、数字の振り返り

```
affiliate/
├── CLAUDE.md
├── roles/          ← 係の定義（役割パックからコピー）
├── research/       ← 候補表（1回1ファイル）
├── articles/       ← 記事（1記事1ファイル）
└── reports/        ← 月次の数字（1ヶ月1ファイル）
```

**ステータス（記事）:** `draft` → `writing` → `linked` → `published`

`linked` は導線係がリンクとPR表記を入れ終わった状態です。記事を書く係と導線係は同じファイルを引き継ぎます。

**係（役割パック）:**

この部署は「係」を4人に分けて回します。定義は `roles/` に置きます。

| 係 | 担当 |
|----|------|
| ネタ探し係 | 次に書く商品とキーワードを決める |
| 記事を書く係 | 読者が選べる記事にする |
| 導線係 | リンク・PR表記・ボタンを入れる |
| 数字を見る係 | 数字を見て次に直す1箇所を決める |

各係のファイルは「何をする人か / 渡す材料 / 出してほしい形 / やったらあかんこと」の4行です。
4行目のうち、ジャンル固有のNGは空欄で渡されます。そこは利用者が自分で埋めてください。
