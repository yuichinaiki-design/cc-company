# Higgsfield で素材を作る（3D / 画像 / 動画）と GLB の軽量化

このファイルは SKILL.md の Step 2 の詳細。**順番は「参照画像 → GLB → 追加素材 → 軽量化 → 確認」**。

---

## 1. リファレンス画像（4 面図）

3D 化モデルは参照画像の枚数と質で形が決まる（1〜4 枚渡せる）。写真が無い、または製品がまだ無いときは画像モデルで作る。

**プロンプトの型**（画像モデル: GPT Image 2.5 / Nano Banana 2）

```
Product reference sheet of {製品名・特徴}: front view, left side view, back view, top view,
arranged in a 2x2 grid, identical scale, pure white background, soft neutral studio lighting,
no shadows, no text, no props. Orthographic look, sharp edges, true colors.
```

日本語で頼むなら: 「{製品} の 4 面図（正面・左側面・背面・上面）を 2x2 で 1 枚に。白背景、同じスケール、影なし、文字なし」。

- 4 面が **同じスケール・同じ製品**に見えるかだけ確認する。ずれていたら作り直す（3D 化のやり直しより安い）。
- 手元に実物があるなら、白い紙の上で撮った写真 4 枚のほうが確実。
- CLI: `higgsfield generate create gpt_image_2_5 --prompt "..." --wait`

**写真が 1〜3 枚だけあるとき**: 3D 化に足りないのは「反対側」と「上下」。選択肢は 2 つ。

1. **撮り足す** —— 白い紙の上、同じ距離・同じ高さで、背面と上面を撮る。一番確実
2. **補完する** —— 手持ちの写真を参照画像として画像モデルに渡し、「同じ製品の背面図・上面図、同じスケール、白背景」を作らせる（`prompts.md` §1-2b）。ロゴ位置や端子の形が変わっていないか見比べる

1 枚しか無いなら、まず `image_to_3d` で作ってみる。背面が崩れたら 2 に戻る。

---

## 2. GLB を作る — 5 つの 3D モデル

Higgsfield の 3D モデルは 5 つ。**どれも結果は GLB**（メッシュ＋テクスチャ＋要求すればスケルトン / アニメーション）。GLB は Three.js、Blender、Unity、Unreal、Godot、ブラウザの GLB ビューアでそのまま開ける。

| モデル ID | 名前 | 入力 | 使う場面 |
|---|---|---|---|
| `multi_image_to_3d` | Multi-Image to 3D | 画像 1〜4 枚（`--image` を繰り返す） | **製品の基本形。** 4 面図から起こす |
| `image_to_3d` | Image to 3D | 画像 1 枚 | 写真が 1 枚しか無い / キャラクター（リグ・アニメーション付き） |
| `tripo_3d` | Text to 3D | プロンプト | 参照画像が無い小物・抽象オブジェクト |
| `sam_3_3d` | 3D Objects | 画像（＋対象を示すプロンプト） | 写真の中の 1 物体を切り出してテクスチャ付き GLB にする |
| `3d_rigging` | 3D Rigging | 既存 GLB の URL | 出来上がった GLB にリグ・アニメーションを後付け |

**複数の物体からなる製品**（本体＋充電ケース、左右一対のイヤホン、セット商品）は、**物体ごとに別の GLB** として生成し、サイト側で配置する。
1 枚の写真に複数の物体を入れて 3D 化すると、物体どうしが融合した 1 メッシュになり、単独表示も分解もできなくなる。写真が一体で撮れているときは `sam_3_3d` に
「the charging case」「the left earbud」と対象を指定して 1 物体ずつ切り出す。

**フラグ名はモデルごとに違う。** 下の表は `image_to_3d` / `multi_image_to_3d` のもの。`tripo_3d` は `--texture` / `--pbr` / `--texture_quality` / `--geometry_quality` / `--face_limit`、
`sam_3_3d` は `--export_textured_glb` / `--detection_threshold`。迷ったら `higgsfield model get <モデルID>` で正解を引く。

### 主なパラメータ（`image_to_3d` / `multi_image_to_3d` 共通）

| フラグ | 意味 | Web 向きの初期値 |
|---|---|---|
| `--should_texture` | テクスチャを付ける | `true`（素のメッシュはブラウザで安く見える） |
| `--enable_pbr` | PBR マテリアル（金属感・粗さ） | 質感が要る製品は `true`（`should_texture true` が前提） |
| `--texture_prompt` | テクスチャの指示 | 色・素材名を短く（`should_texture true` が前提） |
| `--target_polycount` | ポリゴン数の目標 | 30,000〜100,000。スマホ向けは低め |
| `--symmetry_mode` | 対称性 | 製品は `auto`、非対称なら `off` |
| `--should_remesh` / `--topology` | リメッシュ / 面の種類 | 既定のまま。Blender で編集するなら `quad` |
| `--pose_mode` | `a-pose` / `t-pose` | キャラクターは `a-pose` |
| `--enable_rigging` | リグ（骨）を付ける | キャラクターのみ |
| `--enable_animation` + `--animation_action_id` | アニメーションを付ける | `enable_rigging true` が前提。ID は `higgsfield preset list animation-action` |
| `--rigging_height_meters` | 実寸（m） | キャラクターの身長 |

制約（そのまま覚える）: `enable_animation` は `enable_rigging=true` が必要。`enable_animation=true` なら `animation_action_id` 必須。
`texture_prompt` / `texture_image_url` / `enable_pbr` は `should_texture=true` が必要。

### CLI の例

```bash
# パラメータの一覧はいつでもここで引ける
higgsfield model list
higgsfield model get multi_image_to_3d

# 製品: 4 面図から、テクスチャ・PBR 付き、8 万ポリゴン
higgsfield generate create multi_image_to_3d \
  --image ./front.png --image ./side.png --image ./back.png --image ./top.png \
  --should_texture true --enable_pbr true --target_polycount 80000 --symmetry_mode auto --wait

# 文章だけから小物
higgsfield generate create tripo_3d \
  --prompt "matte black wireless earbuds charging case, rounded rectangle, subtle seam line" \
  --texture true --pbr true --geometry_quality detailed --wait

# 写真の中の物体だけを 3D に
higgsfield generate create sam_3_3d --image ./shelf-photo.jpg --prompt "the white sneaker" --wait

# キャラクター: 1 枚絵からリグ＋アニメーション付き
higgsfield preset list animation-action                     # 動作 ID を選ぶ
higgsfield generate create image_to_3d --image ./mascot.png \
  --should_texture true --enable_rigging true --pose_mode a-pose \
  --enable_animation true --animation_action_id <ID> --wait

# 既存の GLB にアニメーションを追加
higgsfield generate create 3d_rigging --model_url <GLBのURL> --enable_animation true --animation_action_id <ID> --wait
```

`--wait` を付けると完了まで待って結果 URL が返る。ChatGPT のプラグイン経由なら、同じ内容を日本語で頼めばよい
（例: 「この 4 枚から Higgsfield の Multi-Image to 3D で、テクスチャと PBR 付き、8 万ポリゴン以下の GLB を作って」）。

### 結果の見方

- **必ず GLB を開いて見る**。ブラウザの GLB ビューア（three.js editor など）か `npx @gltf-transform/cli inspect model.glb`（メッシュ数・頂点数・テクスチャサイズが出る）。
- チェック: 穴 / 裏返った面 / テクスチャのにじみ / 想定と違う縮尺。だめなら **参照画像を足して作り直す**。生成物の手直しより早い。
- **分解ビュー（パターン B）を作るなら、パーツごとにメッシュが分かれているか**を `inspect` で見る。写真から生成した GLB は 1 メッシュになりやすい。1 メッシュだったときの選択肢は 3 つ:
  1. **分割生成** —— 物体ごとに別 GLB を作ってサイト側で並べる（上記）
  2. **ホットスポット** —— 1 メッシュのまま、3D 上の位置にピンを置いて説明を出す（`interactions.md` §1, §5b）
  3. **Blender で分割・命名** —— Astra に Blender を操作させて部位ごとに切り分ける。Xen Studios の事例（`case-studies.md`）の「分離されたコンポーネント」は、この Blender / Cinema 4D 工程で作られたもので、生成 API の直接出力ではない

---

## 3. 追加素材

### スクロール映像（パターン C）— Seedance 2.5

Higgsfield の scroll-scrub 方式は「訪問者のスクロールで **1 本の生成映像**が再生され、章立ての本文がその上に載る」。
既定は **一続きの約 15 秒 1 ショット**。カット割りすると継ぎ目が出るので、1 本で「同じ被写体にどんどん寄っていく」構図にする。

```
One continuous 15-second shot, no cuts: {製品} on {舞台}. The camera starts wide,
slowly orbits and pushes in to a macro detail of {ディテール}. {ライティング}, {色調},
photoreal, stable exposure, no text, no people.
```

- CLI: `higgsfield generate create seedance_2_5 --prompt "..." --image ./storyboard.png --wait`（パラメータは `higgsfield model get seedance_2_5`）
- 動画はクレジット消費が大きい。ストーリーボード画像（1 枚）で構図を固めてから本番 1 本にする。

### カバー / OG 画像

公開前に必ず 1 枚（1200x630 目安）。共有プレビューが空のカードになるのを防ぐ。画像モデルで「サイトのヒーローを 1 枚に」で足りる。

### 環境光（ライティング）

Three.js の `RoomEnvironment` で PBR マテリアルは十分きれいに光る。HDRI（`.hdr`）を用意するのは、
特定の写り込み（夕景、店内）が要るときだけ。

---

## 4. GLB の軽量化（Web に載せる前に必ず）

目安: **GLB 合計 10〜20 MB 以下**、テクスチャは 2048px 以下、ポリゴンは合計 10〜30 万まで。

**誰が実行するか**: 環境 (a) ChatGPT と (b) Supercomputer では、下のコマンドを **Astra / エージェントに実行させる**（「Draco 圧縮してテクスチャを 2048px に落として、前後のサイズを教えて」）。
ユーザーにターミナルを開かせない。環境 (c) では Claude が自分で叩く。

```bash
# 圧縮（Draco）＋テクスチャを WebP 化＋上限 2048px
npx @gltf-transform/cli optimize model.glb model.web.glb --compress draco --texture-compress webp --texture-size 2048

# 中身を確認
npx @gltf-transform/cli inspect model.web.glb
```

- Draco で圧縮した GLB を Three.js で読むには `DRACOLoader` とデコーダのパス指定が要る（`interactions.md` 参照）。Astra への指示に「Draco 圧縮 GLB を読めるように」と一言入れる。
- それでも重いときは gltf-transform の簡略化（`--simplify true --simplify-ratio 0.5` で頂点を半分に）を試し、形が崩れるなら `--target_polycount` を下げて再生成するか、Blender の Decimate モディファイアで削る。
- テクスチャの解像度は見た目に効くが、スマホでは 2048px 超はほぼ判別できない。

---

## 5. 既存の 3D データがあるとき

FBX / OBJ / STEP / Blender ファイルは **Blender で glTF 2.0（`.glb`）にエクスポート**する。そのとき:

1. スケールを実寸に合わせ、トランスフォームを適用（Apply All Transforms）
2. **パーツに意味のある名前**を付ける（`Case`, `Lid`, `Battery`…）。分解ビューはこの名前で説明文を引く
3. 入れ子（親子）の階層は浅くする。深い階層は分解の押し出し方向が狂いやすい
4. 不要なカメラ・ライト・空オブジェクトを消す
5. 「Compression（Draco）」にチェックを入れて書き出す

Higgsfield 公式の事例では、Astra に **Blender を操作させて**モデリング → GLB 書き出し → Three.js ビューア → Cloudflare Workers へデプロイまで通している（`case-studies.md` の Orbital Core Showcase）。
Blender 作業も Astra に頼める、と覚えておく。
