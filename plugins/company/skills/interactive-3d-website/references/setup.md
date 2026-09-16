# 環境別セットアップ

3 つの環境のどれでも、SKILL.md の Step 1〜6 は同じ。違うのは「誰が Higgsfield を呼ぶか」と「サイトをどこで組んで公開するか」だけ。

| 環境 | Higgsfield の呼び方 | サイトを組むのは | 公開先 | 向く人 |
|---|---|---|---|---|
| (a) ChatGPT + Higgsfield プラグイン | 会話中に Astra がプラグインを呼ぶ | GPT-6 Astra | ChatGPT Sites | コードを書かずに最速で URL を出したい |
| (b) Higgsfield Supercomputer | 標準搭載（プラグイン不要） | Supercomputer のエージェント | Higgsfield のライブ URL（`higgsfield.app`） | Higgsfield 側で完結させたい |
| (c) Claude Code / Cursor + Higgsfield CLI・skills | `higgsfield` CLI | Claude / Cursor が Three.js を書く | `higgsfield website deploy` または自前ホスティング | 既存リポジトリに組み込む、CI で回す、細かく制御したい |

---

## (a) ChatGPT + Higgsfield プラグイン

1. **ChatGPT デスクトップアプリ**を用意する（Higgsfield 公式ブログはデスクトップアプリからプラグインを入れる手順で案内している）。
2. ChatGPT で **Plugins** を開き、**Higgsfield** を検索して **Add**。Higgsfield アカウントでサインインし、認可（Authorize）する。
   `higgsfield.ai/mcp` の「Add Higgsfield plugin」から入っても同じ。API キーや設定ファイルは要らない。
3. 新しいチャットを開き、**Work** に切り替えて、モデルに **Astra**（GPT-6 Astra）を選ぶ。
   Plus プランでは Astra は Work と Codex でのみ現れる。Astra が見つからないときはまずここを疑う。
4. メッセージ欄の横の **ツールメニュー**を開き、**Higgsfield が ON** になっているか確かめる。
5. 疎通確認。次の 1 行を送って画像が返ればつながっている。

   > Higgsfield で、白背景に置いたワイヤレスイヤホンの正面図を 1 枚作って。

**この環境の制約**: Higgsfield の Website Builder スキルは ChatGPT では使えない（Higgsfield ヘルプセンターの記載）。
サイトの構築と公開は **Astra + Sites** が担い、Higgsfield は素材（3D / 画像 / 動画）を出す。
この分担のままで、このスキルのワークフローは全部回る。

---

## (b) Higgsfield Supercomputer

- `higgsfield.ai` の **Supercomputer** を開く。別アプリもプラグインも不要で、画像・動画・3D の生成と、サイトの構築・公開が同じ場所でできる。
- 「build a landing page for a fitness studio」のように説明すると、エージェントが計画・構築し、`higgsfield.app` のライブ URL が返る。
- 3D モデルもここで頼める。結果は GLB。
- ChatGPT と違い、Higgsfield の Website Builder がそのまま使える。「素材もサイトも Higgsfield で」の最短経路。

---

## (c) Claude Code / Cursor + Higgsfield CLI・skills

### CLI

```bash
curl -fsSL https://raw.githubusercontent.com/higgsfield-ai/cli/main/install.sh | sh
higgsfield auth login        # ブラウザでサインイン（対話式）
higgsfield account status    # Session expired / Not authenticated なら login からやり直す
```

### 公式 skills（Higgsfield が配布している Markdown スキル）

```bash
npx skills add higgsfield-ai/skills
```

Claude Code の中からなら:

```
/plugin marketplace add higgsfield-ai/skills
/plugin install higgsfield@higgsfield
```

このワークフローで使うのは主に 3 つ。

| スキル | 呼び出し | 使う場面 |
|---|---|---|
| `higgsfield-generate` | `/higgsfield:generate` | 画像・動画・3D（GLB）・音声の生成。`multi_image_to_3d` などを叩く |
| `higgsfield-websites` | `/higgsfield:websites` | サイトの作成・編集・デプロイ（`higgsfield website …`）。React 19 + TanStack Start、Cloudflare Worker |
| `higgsfield-game-generation` | `/higgsfield:game-generation` | リグ・アニメーション付き 3D キャラ、ゲーム寄りの体験 |

### MCP で直接つなぐ

Claude や ChatGPT に Higgsfield MCP をつなぐ手順は、Higgsfield ヘルプセンター
「How to Connect Higgsfield to Claude or ChatGPT」（`higgsfield.ai/creator-hub/help-center/integrations/`）にある。
CLI を入れたくない環境ではこちら。

---

## つながらないときの確認順

1. サインインは有効か（`higgsfield account status` / プラグインの認可をやり直す）
2. **Work モードで Astra を選んでいるか**（ChatGPT の場合）
3. ツールメニューで Higgsfield が ON か
4. Higgsfield のクレジット残があるか（3D と動画は消費が大きい）
5. それでもだめなら、環境を (b) Supercomputer に切り替えて素材だけ先に作る。素材は環境をまたいで使える（GLB は単なるファイル）。
