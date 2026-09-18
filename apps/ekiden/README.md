# 駅伝盛り上げアプリ

沿道にいる観覧者が、目の前を通った選手のゼッケン番号ボタンをタップすると、その瞬間の GPS 位置が共有され、全アプリ利用者が各選手の現在位置をリアルタイム地図で確認できる PWA。観覧者が多いほど同一ゼッケンの目撃報告が集まり、クラウドソース的に位置精度が上がる。

## スタック

- Next.js 15 (App Router) + TypeScript
- PWA: `next-pwa`
- リアルタイム: Supabase (Postgres + Realtime)
- 地図: Leaflet + react-leaflet + OpenStreetMap タイル
- 認証: 匿名 (`localStorage` に UUID を保存)

## セットアップ

### 1. Supabase プロジェクト作成

<https://supabase.com> で無料プロジェクトを作成し、以下をメモ:

- Project URL (`https://xxxx.supabase.co`)
- `anon` public key

### 2. スキーマを適用

Supabase ダッシュボードの **SQL Editor** で `supabase/migrations/20260417000000_init.sql` の内容を実行。

ローカル検証用にサンプルレース＋ゼッケン 1〜10 を投入する場合は `supabase/seed.sql` も実行。

（Supabase CLI を使う場合は `supabase link` → `supabase db push` でも可）

### 3. 環境変数

```bash
cp .env.local.example .env.local
# .env.local を編集して Supabase の URL / anon key を記入
```

### 4. 依存関係インストールと起動

```bash
npm install
npm run dev
```

<http://localhost:3000> を開くとレース一覧が表示される。

## 使い方

1. トップ画面でレースを選ぶ（または作成する）
2. 「管理」からランナー一覧を `ゼッケン,名前,チーム` 形式で一括登録
3. レース画面で、目の前を通った選手のゼッケンボタンをタップ
4. GPS 許可ダイアログで「許可」を選択（初回のみ）
5. 地図上に各選手のピンがリアルタイムで更新される

## End-to-End 検証手順

1. `cd apps/ekiden && npm install`
2. Supabase プロジェクト作成 → マイグレーション + seed 実行
3. `.env.local` に URL / anon key を記入
4. `npm run dev` でローカル起動
5. トップ画面でサンプルレースを選択
6. 別のブラウザ（または LAN 経由で実機スマホ）で同じレースを開く
7. 片方でゼッケン `3` をタップ → 1 秒以内に両方の地図にピンが出る
8. 20m ほど移動して再タップ → ピンが新しい位置に追従
9. 別の観覧者が別地点で同じゼッケン 3 をタップすると、集約ピンは 2 点の間（新しい方寄り）に出る
10. `npm run build && npm start` → Lighthouse PWA 監査で **Installable** がパス
11. モバイル Chrome / Safari で「ホーム画面に追加」→ スタンドアロン起動を確認

## 位置集約アルゴリズム

各ゼッケンについて、Realtime で受信した sightings から以下で「現在位置」を算出（`src/lib/aggregate.ts`、純関数）:

1. 過去 **120 秒**以内の sightings を新しい順に最大 **10 件**取得
2. 平均緯度経度からメートル単位の距離分布を求める
3. 4 件以上ある場合は `mean + 2σ` を超える外れ値を除外
4. 重み付き平均を計算: `w = 1 / ((now - observed_at_sec) + 5)`、`accuracy` があれば `w /= max(accuracy, 5)`
5. 新着がなくても 2 秒毎に再集約 → 古い報告は自然に影響が減衰

## MVP で意図的にやらないこと

- 認証／観覧者アカウント
- ランナー自身による GPS 送信
- コースポリライン登録・スナップ
- ETA 予測
- プッシュ通知
- オフライン sighting キュー（バックグラウンド同期）
- i18n（UI 日本語のみ）
- レート制限／スパム対策、admin 認証
- 地図クラスタリング、ダークモード

## 本番デプロイ

- フロントは Vercel 推奨。環境変数 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定するだけ
- Supabase 側は同じプロジェクトを使用（本番・ステージングで分けても良い）
- PWA の Service Worker は `NODE_ENV=production` のみ有効

## 既知の制限・セキュリティ上の注意

MVP では anon ユーザーが `runners` / `races` / `sightings` への insert を自由にできる設定になっている。
本番運用前に RLS ポリシーを硬化すること（admin 操作はサービスロールキー経由にする、`sightings` にレート制限を入れる等）。
