# 実例パターン集（検証済みの公開事例）

体験パターン A〜E を決めるとき、Astra に「こういうものを」と示すときに使う。
出典は GPT-6 Astra の公開事例を集めた 2 つのリポジトリ（`sources.md`）。**各事例の内容は投稿者の自己申告**で、こちらで再現・検証したものではない。
リンク先の投稿を見せて「この操作感で」と言うのが一番速い。

| パターン | 事例 | 何ができるか | 作り方（投稿者の説明） | 公開先 |
|---|---|---|---|---|
| A ショールーム | **Orbital Core Showcase**（ruofeng） | Blender で作った二重リングのエネルギーコアを回転・ズーム | Astra が Blender でモデリング → GLB のマテリアルを書き出し → Three.js ビューア → Cloudflare Workers にデプロイ | `orbital-core-showcase.wangruofeng007.workers.dev`（コードも公開） |
| A ショールーム（映像型） | **VEYRA Interactive Car**（Amir Mušić） | 架空 EV のカットアウェイ映像＋外観の切替＋レスポンシブな製品 UI | Astra がサイトを統括、外観は GPT Image 2.5、**3D モデルではなく用意した映像トランジション**で見せる | GitHub にコード |
| B 分解ビュー | **Model X Studio**（ashe） | Tesla Model X の分解表示、部品の単独表示と説明 | Astra がサイトを構築。既存の Model X アセット（334 メッシュ）を使用 | `model-x-studio.vercel.app`（コードも公開） |
| B 分解ビュー | **Exploded Male Anatomy**（ashe） | 人体モデルを 2,234 個のパーツに分解 | Astra がサイトを構築 | `human-atlas-seven.vercel.app` |
| B 分解ビュー | **Microduck Assembly Lab**（yishan） | ロボットの組立ビューア。70 パーツが選択でき、位置と説明が出る | 既存 CAD データを Astra がビューア化 | `microduck-assembly-lab.yishan-lin.chatgpt.site`（**ChatGPT Sites**） |
| B 分解ビュー | **Interactive 3D Ankle Atlas**（Emanuel AOF） | 足首の骨・靭帯・腱、運動軸、動きの数値表示 | 「足首の痛みを説明して」と頼んだ 1 セッションで生成 | 投稿の動画 |
| B / 教育 | **David の 3,672 の彫り跡**（Priyanka Vergadia） | ミケランジェロのダビデ像を彫り跡単位で分解する 3D サイト | Astra で構築 | 投稿 |
| C スクロール・ジャーニー | Higgsfield 公式 **scroll-scrub** 方式 | スクロールで 1 本の生成映像が再生され、章立ての本文が上に載る | 約 15 秒の一続きのショットを Seedance で 1 本生成 → スクロールでシーク | Higgsfield website |
| D 歩ける世界 | **Moonlit Forge Studio**（歸藏） | 光る小さな鍛冶場のジオラマ、シーン操作 | Astra が Blender でモデリング → Three.js に読み込み → 操作を追加 → **ChatGPT Sites** で公開 | `moonlit-forge-studio.op7418.chatgpt.site` |
| D 歩ける世界 | **Hangzhou in Three.js**（SuSu） | 都市のオービット操作、ランドマークへのフライト、時間で変わる光 | Astra が Three.js で構築 | 投稿の動画 |
| D 歩ける世界 | **Asteria Spaceship Explorer**（Weng Siong） | 宇宙船の外観と展望ラウンジから太陽系を眺める | React + Three.js + Blender | `asteria.wengsiong22.workers.dev` |
| E キャラクター | Higgsfield 公式 **9 ステップ・プロンプト** | Soul 2.0 でキャラ設計 → テクスチャ付き 3D → Blender でリトポ・UV・リグ → Seedance 2.5 でカートゥーン化 | `prompts.md` §1-5 の原文 | 投稿 |
| 製品可視化 | **Xen Studios のヘルスウェアラブル** | 4 面図から、パーツ分割済み・テクスチャ付き・アニメーション可能な 3D モデル | 「four-angle reference image から、最適化されたトポロジーと **分離されたコンポーネント**を持つモデルを構築」。分離は **Blender / Cinema 4D の工程**で行っており、生成 API の直接出力ではない | 投稿 |

## 事例から借りるもの / 借りないもの

- **借りる**: 「クリックで 1 パーツを単独表示＋説明」（Model X Studio）、「スライダーで分解」（Anatomy）、「ランドマーク一覧からカメラを飛ばす」（Hangzhou）、「3D を起こさず映像で見せる」（VEYRA）、「4 面図 → パーツ分割済みモデル」（Xen Studios）
- **借りない**: パーツ数の多さ自慢。2,000 パーツは技術デモとしては面白いが、製品 LP では 5〜15 パーツに絞ったほうが伝わる
- **注意**: Model X Studio は既存の商用 3D アセットを使っている。実在製品を扱うときは権利の確認をビルドシートに書く

## 公開先の傾向

- ChatGPT の中で完結した事例は **ChatGPT Sites**（`*.chatgpt.site`）
- Blender・Three.js を Astra に操作させた事例は **Cloudflare Workers** か **Vercel**
- Higgsfield 側で作る場合は **Higgsfield website**（`publish.md` §2）
