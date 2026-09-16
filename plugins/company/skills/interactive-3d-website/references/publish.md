# 公開経路（ChatGPT Sites / Higgsfield website CLI / 自前ホスティング）

公開の前に必ず: **プレビューを見る → SKILL.md Step 4 の QA → OG（タイトル・説明・カバー）を入れる**。順番を守るのは、
公開 URL が一度 SNS に流れると、空のカードやエラー画面がキャッシュされて戻せないことがあるから。

| 経路 | 向く場面 | 得られる URL | 更新の仕方 |
|---|---|---|---|
| ChatGPT Sites | ChatGPT で作った流れのまま最速で出す | `*.chatgpt.site`（事例では `{slug}.{ユーザー名}.chatgpt.site`） | 会話で頼む |
| Higgsfield website（CLI） | Claude Code / Cursor で作業。DB・ストレージ・独自サブドメインが要る | Higgsfield 側のサブドメイン（`--subdomain` で指定） | `git push` → `higgsfield website deploy` |
| 自前ホスティング | 既存サイトに組み込む、独自ドメイン、CI | 任意 | 通常のデプロイ |

---

## 1. ChatGPT Sites

Sites は、ChatGPT の中で Astra が **Web サイト・Web アプリ・ゲームを作り、ホストし、共有する**仕組み。プロンプトから直接 URL が出る。

手順:

1. ビルドが動く状態になったら「**Sites にプレビューを出して**」と頼み、URL を開いて Step 4 の QA をする
2. 直しを頼む（`prompts.md` §3）。直ったら「**"{slug}" として Sites に公開して**」
3. 共有前に OG を確認: 「タイトル・説明・cover.jpg を OG に設定して、リンクプレビューの見え方を見せて」

注意:

- GLB や動画はサイトと一緒にホストされる。**重いファイルほど読み込みが遅い**ので、`3d-assets.md` §4 の軽量化を公開前に済ませる
- 事例の URL は `moonlit-forge-studio.op7418.chatgpt.site` や `microduck-assembly-lab.yishan-lin.chatgpt.site` のように **slug + ユーザー名**の形。slug は短く覚えやすく
- Sites 側の slug の制約は未確認。**英小文字・数字・ハイフンだけ、5 文字以上**にしておけば、§2 の Higgsfield website の規則にもそのまま使い回せる
- 独自ドメインや DB が要るなら、次の Higgsfield website か自前ホスティングへ

---

## 2. Higgsfield website（CLI）

Higgsfield の `higgsfield website …` は **React 19 + TanStack Start（SSR）を 1 つの Cloudflare Worker として**デプロイする。D1（DB）/ R2（ストレージ）/ KV / Durable Objects / Containers が使える。
公式 skills の `higgsfield-websites`（`/higgsfield:websites`）がこの流れを一式面倒を見る。

```bash
# 1. 作る（--type は必須。3D ビューアのような「ユーザーが生成を行わない」サイトは website）
#    --subdomain は必ず付ける（省略するとランダムな slug になる）
higgsfield website create --type website --subdomain earbuds-showroom
#    → website_id が返る

# 2. リポジトリへのアクセスを得て、ローカルで編集（コードは app/ 配下。bun/ビルドは app/ で実行）
higgsfield website repo-access <website_id>
git clone <返ってきたリポジトリURL> && cd <repo>/app

# 3. 編集して push（Three.js はクライアント側だけで動かす。SSR 中に window を触らない）

# 4. デプロイ（変更のたびに実行。デプロイ＝即ライブ公開。プレビュー段階は無い）
higgsfield website deploy <website_id>

# 5. URL と状態
higgsfield website status <website_id>

# 6. （任意）Higgsfield のコミュニティフィードに掲載。deploy とは別で、最後に deploy した内容が載る
higgsfield website publish <website_id>
```

ルール（公式 skill から）:

- `--subdomain` は **5 文字以上**、小文字・数字・単一ハイフンのみ。`api` / `www` / `app` などは予約済み
- `--type website` は「Higgsfield 連携なし・実行時の AI 生成なし」のサイト。**ビルド時に Higgsfield で素材を作って同梱するのは問題ない**（訪問者から見えない）。訪問者に画像・動画を生成させる機能を付けるなら `--type app`
- **カバーとメタデータはビルドの一部**。`app/src/app-meta.json` に `og_title` / `og_description` / `favicon_url` / `og_image_url` を入れる。空のまま publish すると空のカードになる
- `deploy` は **即ライブ**。壊れた状態を push しない。ローカルで動かしてから
- サブドメインの変更は `higgsfield website rename <website_id> --subdomain <new>`

ChatGPT ではこの経路は使えない（Website Builder は Claude / Cursor / CLI 向け）。ChatGPT で作った Three.js のコードを、ここに移植して公開することはできる。

---

## 3. 自前ホスティング

3D ビューアの本体は **静的ファイル**（HTML / JS / GLB / 画像）。どこにでも置ける。

- **Cloudflare Pages / Workers**: 事例の Orbital Core Showcase は Blender → GLB → Three.js → Cloudflare Workers で公開
- **Vercel**: 事例の Model X Studio、Exploded Male Anatomy は Vercel
- **GitHub Pages**: リポジトリの `docs/` か `gh-pages` に置くだけ。無料で十分速い

置くときの注意:

- **GLB の MIME**: `model/gltf-binary`。多くのホストは自動で付くが、独自サーバーなら設定する
- **キャッシュ**: GLB はファイル名にハッシュを付けて長期キャッシュ（`model.a1b2c3.glb`）。差し替えたら名前も変える
- **別オリジンに置く GLB** は CORS ヘッダー（`Access-Control-Allow-Origin`）が要る。同じオリジンに置くのが簡単
- **サイズ上限**: ホストごとに 1 ファイルの上限がある（数十 MB のことが多い）。`3d-assets.md` §4 の軽量化を先に
- **Draco デコーダ**: CDN 参照でよいが、社内ネットワークなど CDN が塞がれる環境なら同梱する

Astra に頼むときの一言: 「`dist/` に静的ファイルとして書き出して。GLB は `public/models/` に。ハッシュ付きファイル名で」。

---

## 4. 公開後

- 公開 URL と日付を **ビルドシートの「公開 URL / 変更履歴」** に書く
- 修正は小さく、1 件ずつ。直したら QA の該当項目だけ再確認して再公開
- 3D モデルを差し替えるときは、**メッシュ名が変わっていないか**を先に見る（分解ビューの説明表が外れる）
