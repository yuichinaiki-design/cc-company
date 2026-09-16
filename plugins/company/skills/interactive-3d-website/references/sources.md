# 出典と注記

このスキルは **2026-09-16 時点**で、ドキュメントとして読めた一次情報だけを土台にしている。UI の文言や手順は変わるので、合わないときはここから当たり直す。

## 元になった Notion ページについて

このスキルの依頼元は次の Notion ページ:

- Igor Kosovskiy（ikosovskiy）「How to Build Interactive 3D Websites with ChatGPT + Higgsfield」
  `https://app.notion.com/p/ikosovskiy/How-to-Build-Interactive-3D-Websites-with-ChatGPT-Higgsfield-3d7ea5a9abdd8142b3aec45c8f38c50e`

**作成時点では、このページ本文は取得できていない。** 作成環境のネットワーク制限で Notion のドメインが読めず、Notion コネクタからも
（作成者のワークスペース外のページのため）アクセスできなかった。そのため本スキルは、同じテーマ（ChatGPT の GPT-6 Astra + Higgsfield で
インタラクティブ 3D サイトを作る）について **Higgsfield 公式ドキュメントと公開事例**から組み立てている。

ページ本文が読めたら、次の 3 点を突き合わせて更新すること:

1. 著者が推す **体験パターンと手順の順番**（SKILL.md Step 1〜3）
2. 著者の **プロンプト原文**（`prompts.md` に「著者のプロンプト」節を追加）
3. 著者が使った **公開経路とツール**（`publish.md`, `setup.md`）

## 一次情報（本文を直接読んだもの）

| 出典 | 使った箇所 |
|---|---|
| Higgsfield 公式 skills リポジトリ `github.com/higgsfield-ai/skills` — `README.md`, `INSTALL.md`, `higgsfield-generate/SKILL.md`, `higgsfield-websites/SKILL.md`, `higgsfield-websites/references/website-flow.md`, `references/scroll-scrub.md`, `references/game-3d-animation.md`（v0.12.0） | skills のインストール、`/higgsfield:generate` `/higgsfield:websites`、`multi_image_to_3d` の使い方、website の 3 タイプと `--subdomain` 規則、deploy = 即公開、カバー＋メタデータ、scroll-scrub（15 秒 1 ショット）、リグ付き GLB の流れ |
| Higgsfield 公式 CLI リポジトリ `github.com/higgsfield-ai/cli` — `README.md`, `MODELS.md` | CLI のインストール、`higgsfield website create / repo-access / deploy / status / publish / rename`、3D の 5 モデル（`3d_rigging`, `image_to_3d`, `multi_image_to_3d`, `sam_3_3d`, `tripo_3d`）と全パラメータ・制約 |
| `github.com/magiccreator-ai/awesome-gpt-6-astra` — `README.md`（171 事例、2026-09-14 更新） | `case-studies.md` の各事例（Model X Studio, Exploded Male Anatomy, Microduck Assembly Lab, Moonlit Forge, Orbital Core, VEYRA, Hangzhou, Asteria, Ankle Atlas）と公開先 |
| `github.com/BeatAPI/awesome-3d-prompts` — `README.md` | Higgsfield 公式アカウントの 9 ステップ・プロンプト原文（`x.com/higgsfield_ai/status/2096342420543660277`）、Xen Studios の 4 面図 → 3D の事例、3D サイト事例（David、人体 CAD） |

## 二次情報（検索結果の要約から得たもの。本文は未読）

| 出典 | 使った箇所 |
|---|---|
| Higgsfield ブログ「How to Build a Website with AI in 2026: From Prompt to Live URL」、「Higgsfield MCP on GPT-6 Astra: Introducing Higgsfield Games 2.0」、「Higgsfield Plugin for ChatGPT」 | ChatGPT デスクトップアプリからプラグインを追加する手順、Supercomputer でも同じ機能が使えること、3D モデリング・リギング・再構築に対応していること |
| Higgsfield ヘルプセンター「Website Builder Skill」「How to Connect Higgsfield to Claude or ChatGPT」 | **Website Builder は ChatGPT では使えず Claude / Cursor / CLI 向け**であること、Supercomputer から `higgsfield.app` のライブ URL が出ること |
| Aria「Build a Fully Interactive 3D Model Inside ChatGPT (GPT-6 Astra + Higgsfield)」 | Work モードで Astra を選び、ツールメニューで Higgsfield を ON にする手順、「Astra が計画・構築し、Higgsfield が視覚素材を担う」分担 |
| OpenAI / ChatGPT Learn「Sites」、DataCamp「GPT-6 Astra: Features, Benchmarks, and Pricing」 | Sites でサイト・Web アプリ・ゲームを作成・ホスト・共有できること、Plus では Astra が Work と Codex にのみ出ること |
| scriptable.com「How Higgsfield Does 3D: Images In, Rigged Models Out」 | すべての 3D 生成が GLB を返すこと、GLB が Blender / Unity / Unreal / Godot / three.js で開けること |
| atoms.dev「GPT-6 Astra Early Cases」ほか | 「出力の形・置き場所を名指しし、公開前にプレビューを求める」プロンプトの型 |

## スキル内で「こちらの判断」として書いたもの

- ポリゴン数・GLB サイズ・テクスチャ解像度の目安（Web 制作の一般的な経験則。Higgsfield の規定ではない）
- Three.js のコード（`interactions.md`）と `<model-viewer>` / gltf-transform の使い方（各ライブラリの公開 API に基づく）
- QA チェックリストと「主役の操作は 1 つ」などの設計方針
