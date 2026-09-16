# プロンプト集（フェーズ別・日英）

Astra や Higgsfield に渡す文面の雛形。**{ } をビルドシートの値で埋めて使う。** 英語のほうが安定するので、英語版をそのまま送り、
補足だけ日本語で足すのが楽。会話の言語は最初のメッセージで決まるので、日本語で返してほしければ最後に「返事は日本語で」と付ける。

---

## 0. うまくいく指示の型

すべてのビルド指示に共通する 3 点。**(1) 出力の形を名指しする、(2) 置き場所を名指しする、(3) 公開前にプレビューを求める。**

```
Build {出力の形: an interactive 3D website / a single index.html / a React app} …
Put it in {置き場所: Sites as "{slug}" / this folder / Blender / my desktop} …
Show me a preview before publishing.
```

これが無いと Astra は「説明文＋コード断片」で返してくることがある。欲しいのは動くサイトなので、最初から形と場所を言う。

---

## 1. 素材（Higgsfield）

### 1-1. 4 面図（画像モデル）

```
Using Higgsfield, generate a product reference sheet of {製品名: matte black wireless earbuds with charging case}:
front, left side, back and top views in a 2x2 grid, identical scale, pure white background,
soft neutral studio light, no shadows, no text, no props. Orthographic look, true colors.
```

### 1-2. 製品の GLB（4 面図から）

```
Using Higgsfield's Multi-Image to 3D, turn these 4 reference images into a textured 3D model (GLB).
Enable PBR textures, keep it under 80,000 polygons, symmetry auto. Give me the GLB download link.
```

日本語: 「この 4 枚から Higgsfield の Multi-Image to 3D で、テクスチャと PBR 付き、8 万ポリゴン以下の GLB を作って。ダウンロードリンクをください」

### 1-3. 文章だけから GLB

```
Using Higgsfield's Text to 3D, create a textured, PBR 3D model (GLB) of {対象}, detailed geometry,
{色・素材}, clean silhouette suitable for a website hero object.
```

### 1-4. キャラクター（リグ・アニメーション付き）

```
Using Higgsfield, turn this character image into a 3D model: textured, rigged as a humanoid, A-pose,
with an idle animation and a wave animation. Return a GLB that keeps the animations.
```

### 1-5. Higgsfield 公式の 9 ステップ・プロンプト（原文）

Higgsfield 公式アカウントが GPT-6 Astra 向けに公開したもの。Astra に **コンピュータを操作させて** Blender まで通す型として参考になる（出典: `sources.md`）。

```
Take control of my computer using GPT-6 Astra and do the following:

1. design a character concept using Higgsfield Soul 2.0,
2. build a textured 3D model of it,
3. import it into Blender,
4. retopologize the mesh,
5. create a UV map,
6. build a character rig,
7. evaluate how production-ready the model is,
8. redo previous steps if you're not satisfied with results,
9. and then turn it into a cartoon using Seedance 2.5 on Higgsfield
```

番号付きの手順 ＋ 「満足できなければ前の手順に戻れ」の 1 行が効く。サイト制作でも同じ書き方が使える。

### 1-6. スクロール映像（Seedance 2.5、パターン C）

```
Using Higgsfield (Seedance 2.5), generate ONE continuous 15-second shot with no cuts:
{製品} on {舞台}. Camera starts wide, slowly orbits and pushes in to a macro detail of {ディテール}.
{ライティング}, {色調}, photoreal, stable exposure, no text, no people.
```

---

## 2. サイトのビルド（Astra）

**最初のメッセージには、下の雛形の前に「3D サイト・ビルドシート」を丸ごと貼る。** 雛形だけ送ると仕様が抜ける。

### パターン A: ショールーム

```
Build an interactive 3D showroom website for {製品名} with Three.js.
Assets: model.glb (generated with Higgsfield, Draco-compressed), poster.jpg (fallback), cover.jpg (OG image).
Interactions: drag to orbit, wheel/pinch to zoom, {color/material switcher with 3 variants}, auto-rotate until the first interaction.
Look: {ブランド色}, {明るい/暗い} studio, soft room lighting, lots of whitespace, {フォント}.
Page: hero with the 3D viewer, 3 feature sections with HTML text (not drawn on the canvas), a CTA.
Must have: loading progress bar, mobile touch controls, devicePixelRatio capped at 2,
poster image fallback when WebGL is unavailable, OG title/description/cover.
Output: publish to Sites as "{slug}". Show me a preview before publishing. Reply in Japanese.
```

### パターン B: 分解ビュー（クリックでパーツを単独表示）

```
Build an interactive exploded-view website for {製品名} with Three.js.
Assets: model.glb whose meshes are named by part ({Case, Lid, Battery, PCB, ...}), poster.jpg, cover.jpg.
Interactions: an "Explode" slider (0–1) that moves every part outward from the model center;
click a part to isolate it and show a side panel with its name and description (use this table: {パーツ名: 説明 …});
click the background or press Esc to restore; hover highlight; drag to orbit, wheel/pinch to zoom.
Everything must return to the exact original position at slider = 0.
Must have: loading progress, mobile touch, poster fallback, HTML text for all descriptions, OG metadata.
Output: publish to Sites as "{slug}". Preview first. Reply in Japanese.
```

### パターン C: スクロール・ジャーニー

```
Build a scroll-driven 3D website for {ブランド/製品} with Three.js.
Assets: model.glb, {or film.mp4: one continuous 15s shot generated with Higgsfield}, poster.jpg, cover.jpg.
Behavior: the canvas is sticky and fills the viewport; page scroll progress (0–1) drives the camera along a smooth path
through these 4 chapters: {章1: 全景 / 章2: ディテール / 章3: 機能 / 章4: CTA}. Each chapter is an HTML section with a headline and one sentence.
Ease the camera with damping; respect prefers-reduced-motion (jump cuts instead of motion); no orbit controls in scroll mode.
Must have: loading progress, mobile scroll must not be hijacked, poster fallback, OG metadata.
Output: publish to Sites as "{slug}". Preview first. Reply in Japanese.
```

### パターン D: 歩ける世界・ジオラマ

```
Build an explorable 3D diorama website of {場所/施設} with Three.js.
Assets: scene.glb (Blender export, landmarks named {A, B, C}), poster.jpg, cover.jpg.
Interactions: orbit/zoom over the diorama; a landmark list in HTML — clicking one flies the camera to it and shows a caption;
a day/night toggle that changes lighting; gentle idle camera drift.
Must have: loading progress, mobile touch, poster fallback, OG metadata.
Output: publish to Sites as "{slug}". Preview first. Reply in Japanese.
```

### パターン E: 動くキャラクター

```
Build a landing page where a 3D mascot greets visitors, with Three.js.
Assets: mascot.glb (rigged, with "Idle" and "Wave" animation clips), poster.jpg, cover.jpg.
Behavior: play Idle in a loop; play Wave once on page load and whenever the visitor clicks the mascot;
the mascot's head subtly follows the pointer. Page content in HTML next to the canvas.
Must have: loading progress, mobile touch, poster fallback, reduced-motion fallback (static pose), OG metadata.
Output: publish to Sites as "{slug}". Preview first. Reply in Japanese.
```

### 既存リポジトリに組み込む（環境 (c) / 自前ホスティング）

```
Add an interactive 3D viewer to {既存サイトのパス}. Use Three.js via import map (no bundler) or the existing {Vite/Next} setup.
Load public/models/model.glb with GLTFLoader + DRACOLoader, OrbitControls, RoomEnvironment lighting.
Keep everything client-side (no SSR of Three.js). Follow the existing design tokens. Do not change other pages.
```

---

## 3. 直し（イテレーション）

短く 1 件ずつ。何をどう変えるかを「観測 → 期待」で言う。

- 「初回表示が 6 秒かかる。GLB を Draco 圧縮し、テクスチャを 2048px に落として、3 秒以内に進捗バーが見えるようにして」
- 「ドラッグの慣性が強すぎて止まらない。減衰を強めて、1 秒以内に止まるように」
- 「パーツをクリックしても反応しない部分がある。メッシュ名の一覧を出して、説明表と突き合わせて」
- 「分解スライダーを戻しても Lid が元の位置に戻らない。原点位置を保存して復元して」
- 「スマホで 3D をなでるとページがスクロールしてしまう。キャンバス上は回転、外はスクロールに分けて」
- 「暗すぎる。RoomEnvironment を使って、金属の写り込みが出るようにして」
- 「カメラの初期位置を、もう少し斜め上（俯角 20 度くらい）から」
- 「本文は Canvas に描かず HTML にして。見出しと説明はそのまま検索できるように」

---

## 4. 公開

```
Publish this to Sites as "{slug}". First show me the preview URL and wait for my OK.
```

公開後の共有前に:

```
Set the page title to "{タイトル}", the description to "{説明文}", and cover.jpg as the OG image. Show me how the link preview looks.
```

---

## 5. 引き継ぎ

```
Summarize this build as a handover note: assets used (with the Higgsfield models and parameters), site structure,
interactions, known issues, and how to update the model file. Write it in Japanese.
```

これをビルドシートの末尾に貼って保存する。
