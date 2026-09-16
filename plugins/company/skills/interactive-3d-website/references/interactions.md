# Three.js 実装パターン（Astra に守らせる要点と、最小コード）

Astra は自力で Three.js を書けるが、**次の設計を最初の指示に入れておくと作り直しが無くなる。**
コードは「こう組んでほしい」の見本。Claude Code / Cursor で自分が書くときもこのまま使える。

目次: 1. 最短経路（`<model-viewer>`） / 2. 骨組み（HTML） / 3. 読み込みとライティング / 4. オービット / 5. クリックでパーツを単独表示 / 5b. ホットスポット（1 メッシュに説明ピン） / 6. 分解スライダー / 7. スクロール連動カメラ / 8. キャラクターのアニメーション / 9. 軽さと堅牢さ / 10. React で組むなら / 11. QA の勘所

---

## 1. 最短経路: パターン A は `<model-viewer>` でも足りる

「回して、ズームして、ポスターを見せる」だけなら Google の `<model-viewer>` Web コンポーネントが最速。Three.js を書かずに済む。

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@google/model-viewer@4/dist/model-viewer.min.js"></script>
<model-viewer src="model.glb" poster="poster.jpg" alt="{製品名}の3Dモデル"
  camera-controls auto-rotate shadow-intensity="1" exposure="1"
  style="width:100%;height:100svh;background:#0b0b0c"></model-viewer>
```

**1 メッシュの GLB に「クリックで説明」を付けるだけなら、`<model-viewer>` のホットスポット**で足りる（パターン B-2）。ピンは HTML ボタンなので文字は検索でき、位置は 3D 座標で指定する。

```html
<model-viewer id="mv" src="model.glb" poster="poster.jpg" alt="{製品名}" camera-controls style="width:100%;height:100svh">
  <button class="hotspot" slot="hotspot-usb" data-position="0.00 -0.02 0.05" data-normal="0 0 1" data-visibility-attribute="visible">USB-C 端子</button>
  <button class="hotspot" slot="hotspot-led" data-position="0.00 0.01 0.05" data-normal="0 0 1" data-visibility-attribute="visible">充電 LED</button>
</model-viewer>
<style>.hotspot{border:0;border-radius:999px;padding:4px 10px;background:#fff;color:#111;font-size:12px}.hotspot:not([visible]){opacity:.3}</style>
<script>
// ピンの座標はモデル上をクリックして取る（開発時だけ有効にし、出た値を data-position / data-normal に写す）
const mv = document.getElementById('mv');
mv.addEventListener('click', (e) => {
  const hit = mv.positionAndNormalFromPoint(e.clientX, e.clientY);
  if (hit) console.log('position=', hit.position.toString(), 'normal=', hit.normal.toString());
});
</script>
```

クリックで分離・分解スライダー・スクロール連動が要るなら、以下の Three.js に進む。

---

## 2. 骨組み（HTML）

本文は **HTML のまま**置く（検索・共有・読み上げのため）。Canvas に文字を描かない。

```html
<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{サイト名}</title>
<meta property="og:title" content="{サイト名}" />
<meta property="og:description" content="{説明}" />
<meta property="og:image" content="{絶対URL}/cover.jpg" />
<style>
  html, body { margin: 0; background: #0b0b0c; color: #eee; font-family: system-ui, sans-serif; }
  #viewer { position: relative; width: 100%; height: 100svh; }
  #viewer canvas { display: block; width: 100%; height: 100%; touch-action: none; } /* キャンバス上はページスクロールさせない */
  #poster { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  #progress { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: #5b8cff; transform-origin: left; transform: scaleX(0); }
  #panel { position: absolute; right: 16px; bottom: 16px; max-width: 320px; padding: 12px 16px; background: rgba(0,0,0,.6); border-radius: 12px; }
  #panel[hidden] { display: none; }
  #explode { position: absolute; left: 16px; bottom: 16px; width: 200px; }
</style>
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
} }
</script>
</head>
<body>
<section id="viewer" aria-label="3D ビューア">
  <img id="poster" src="poster.jpg" alt="{製品名}" />
  <div id="progress" role="progressbar" aria-label="読み込み中"></div>
  <aside id="panel" hidden>
    <h2 id="part-name"></h2>
    <p id="part-desc"></p>
    <button id="reset" type="button">全体を表示</button>
  </aside>
  <input id="explode" type="range" min="0" max="1" step="0.01" value="0" aria-label="分解" />
</section>
<main><!-- 見出し・説明・CTA は普通の HTML でここに --></main>
<script type="module" src="./viewer.js"></script>
</body>
</html>
```

Three.js のバージョンは固定する（上は r170）。上げるときは import map の 2 か所と Draco デコーダのパスを揃える。

---

## 3. 読み込みとライティング（`viewer.js` の前半）

```js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// メッシュ名 → 説明（ビルドシートの表から生成する）
const PARTS = {
  Case: { title: 'ケース', desc: '……' },
  Lid:  { title: 'フタ',   desc: '……' },
};

const container = document.getElementById('viewer');
const poster = document.getElementById('poster');
const progress = document.getElementById('progress');

// WebGL が無い環境はポスターのまま終える
const probe = document.createElement('canvas');
if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) {
  document.getElementById('explode').hidden = true;
  throw new Error('WebGL unavailable: showing poster only');
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 高 DPI 端末で GPU を燃やさない
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
// PBR マテリアルはこれだけで自然に光る。HDRI は特定の写り込みが要るときだけ
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.01, 100);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;   // 慣性。強すぎるなら dampingFactor を上げる（既定 0.05）
controls.enablePan = false;      // 製品ビューアはパン不要。迷子を防ぐ
controls.autoRotate = !reducedMotion;
renderer.domElement.addEventListener('pointerdown', () => { controls.autoRotate = false; }, { once: true });

const draco = new DRACOLoader();
draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/');
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

const meshes = [];
let model, size = 1;

loader.load(
  'model.glb',
  (gltf) => {
    model = gltf.scene;
    scene.add(model);

    // モデルの中心を原点へ、大きさに合わせてカメラを置く（GLB の縮尺がまちまちでも同じ見え方にする）
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    size = box.getSize(new THREE.Vector3()).length();
    model.position.sub(center);
    model.updateMatrixWorld(true);
    camera.position.set(size * 0.8, size * 0.45, size * 1.1);
    controls.target.set(0, 0, 0);
    controls.minDistance = size * 0.5;
    controls.maxDistance = size * 3;

    model.traverse((o) => {
      if (!o.isMesh) return;
      o.userData.origin = o.position.clone(); // 分解を元に戻すため必ず保存
      const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()); // 原点＝モデル中心からの向き
      o.userData.dir = worldDirToLocal(o.parent, c.lengthSq() > 1e-8 ? c : new THREE.Vector3(0, 1, 0));
      meshes.push(o);
    });

    poster.remove();
    progress.remove();
  },
  (xhr) => { if (xhr.total) progress.style.transform = `scaleX(${xhr.loaded / xhr.total})`; },
  (err) => { console.error(err); poster.alt += '（3D の読み込みに失敗しました）'; },
);

// ワールド座標の向きを、親ノードのローカル座標系に直す（親が回転していても押し出し方向が狂わない）
function worldDirToLocal(parent, dirWorld) {
  const a = parent.worldToLocal(dirWorld.clone());
  const b = parent.worldToLocal(new THREE.Vector3(0, 0, 0));
  return a.sub(b).normalize();
}

function onResize() {
  const w = container.clientWidth, h = container.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
```

---

## 4. オービット（パターン A）

上のコードで完成。調整点は 3 つだけ。

- 初期カメラ: `camera.position.set(...)` の係数。斜め上から見せると製品は立派に見える
- 慣性: `controls.dampingFactor`（大きいほど早く止まる）
- 回転の制限: `controls.minPolarAngle / maxPolarAngle`（真下から覗けないようにする）

色替え（バリエーション）は、材質を持つメッシュの `material.color.set('#hex')` を切り替える。テクスチャごと替えるなら GLB を分けず、`material.map` を差し替える。

---

## 5. クリックでパーツを単独表示（パターン B）

ドラッグとクリックを区別する（押した位置から 6px 以上動いたらドラッグ扱い）。これが無いと回転のたびにパーツが選ばれる。

```js
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let down = null;

renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
  const r = renderer.domElement.getBoundingClientRect();
  pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(meshes.filter((m) => m.visible), false)[0]; // 隠したパーツは当たり判定から外す
  hit ? isolate(hit.object) : reset();
});

function isolate(target) {
  for (const m of meshes) m.visible = (m === target); // 他を隠す。半透明にしたいなら material を clone して opacity を下げる
  const info = PARTS[target.name] ?? { title: target.name, desc: '' };
  document.getElementById('part-name').textContent = info.title;
  document.getElementById('part-desc').textContent = info.desc;
  document.getElementById('panel').hidden = false;
}
function reset() {
  for (const m of meshes) m.visible = true;
  document.getElementById('panel').hidden = true;
}
document.getElementById('reset').addEventListener('click', reset);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') reset(); });
```

- 説明文は **メッシュ名がキー**。GLB のメッシュ名を先に一覧にして（`npx @gltf-transform/cli inspect`）、表と突き合わせる。名前が `Mesh_001` のような GLB は Blender で命名し直す
- ホバーで光らせるなら `pointermove` で同じレイキャストをし、`material.emissive` を一時的に上げる（元の値を保存して戻す）

---

## 5b. ホットスポット（パターン B-2: 1 メッシュの GLB に説明ピン）

写真から生成した GLB は 1 メッシュで、§5 の「クリックで単独表示」ができない。代わりに **3D 上の座標に HTML のピンを貼り、毎フレーム画面座標へ投影**する。
ピンの座標はメッシュのバウンディングボックス（例: 上面中央 = `box.max.y`）か、開発時にレイキャストした `hit.point` をログして決める。

```js
// GLB 読み込み後（size 確定後）に実行する。3D 座標はモデル中心が原点、size はモデルの大きさ。説明はビルドシートの表から
const HOTSPOTS = [
  { id: 'usb', pos: new THREE.Vector3(0, -0.15, 0.5), title: 'USB-C 端子', desc: '……' },
  { id: 'led', pos: new THREE.Vector3(0, 0.1, 0.5),  title: '充電 LED',  desc: '……' },
].map((h) => ({ ...h, pos: h.pos.multiplyScalar(size) }));

const layer = document.createElement('div'); // キャンバスの上に重ねる透明レイヤー
layer.style.cssText = 'position:absolute;inset:0;pointer-events:none';
container.appendChild(layer);
for (const h of HOTSPOTS) {
  const b = document.createElement('button');
  b.textContent = h.title; b.className = 'hotspot'; b.style.cssText = 'position:absolute;transform:translate(-50%,-50%);pointer-events:auto';
  b.addEventListener('click', () => showPanel(h.title, h.desc));
  layer.appendChild(b); h.el = b;
}

const v = new THREE.Vector3();
function updateHotspots() {
  const w = container.clientWidth, hgt = container.clientHeight;
  for (const h of HOTSPOTS) {
    v.copy(h.pos).project(camera);
    const behind = v.z > 1;                      // カメラの後ろ
    // モデルの裏側に回ったピンは薄くする（カメラからピンへ向くベクトルと、中心からピンへのベクトルの向き）
    const facing = h.pos.clone().normalize().dot(camera.position.clone().sub(h.pos).normalize()) > 0;
    h.el.style.left = `${(v.x * 0.5 + 0.5) * w}px`;
    h.el.style.top = `${(-v.y * 0.5 + 0.5) * hgt}px`;
    h.el.hidden = behind;
    h.el.style.opacity = facing ? '1' : '0.3';
  }
}
// アニメーションループ内で renderer.render(...) の後に updateHotspots();
```

- 説明パネルは §5 の `#panel` を使い回す（`showPanel` はタイトルと本文を入れて `hidden = false` にするだけ）
- ピンの数は 3〜7 個に絞る。多いと重なって読めない
- 物体が複数（本体＋ケース）なら、物体ごとに別 GLB で読み込み（分割生成）、§5 の単独表示と組み合わせる

---

## 6. 分解スライダー（パターン B）

各パーツを「モデル中心から外向き」に押し出す。**元の位置（`userData.origin`）を保存しておき、0 で完全に戻す**。

```js
const explode = document.getElementById('explode');
explode.addEventListener('input', () => {
  const t = parseFloat(explode.value);
  for (const m of meshes) {
    m.position.copy(m.userData.origin).addScaledVector(m.userData.dir, t * size * 0.5);
  }
});
```

- 押し出し量は `size * 0.5` を起点に調整。パーツが多いときは軸ごとに重みを付ける（縦積みの製品は Y を強く）
- 階層が深い GLB は向きが狂いやすい。Blender で親子関係を平らにしてから書き出す（`3d-assets.md` §5）
- 「分解 → 1 パーツをクリック」を連続でやると分かりやすい。§5 と組み合わせる

---

## 7. スクロール連動カメラ（パターン C）

ページのスクロール率 0→1 でカメラをキーフレーム間で補間する。**スクロール中は OrbitControls を切る**（操作が喧嘩する）。
キャンバスは `position: sticky; top: 0; height: 100svh`、章は `min-height: 100svh` の `<section>` にする。
キャンバスの `touch-action` は `pan-y` にして、スマホのページスクロールを奪わない。

```js
controls.enabled = false;

const KEYS = [ // [カメラ位置, 注視点] を章ごとに（size を掛けて縮尺に追従）
  [new THREE.Vector3(0.8, 0.45, 1.1), new THREE.Vector3(0, 0, 0)],
  [new THREE.Vector3(0.3, 0.2, 0.5),  new THREE.Vector3(0, 0.05, 0)],
  [new THREE.Vector3(-0.6, 0.5, 0.7), new THREE.Vector3(0, 0, 0)],
  [new THREE.Vector3(0, 0.9, 0.9),    new THREE.Vector3(0, 0, 0)],
].map(([p, t]) => [p.multiplyScalar(size), t.multiplyScalar(size)]);
const posCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => k[0]));
const tgtCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => k[1]));

let scrollT = 0, smoothT = 0;
window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  scrollT = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
}, { passive: true });

const lookAt = new THREE.Vector3();
renderer.setAnimationLoop(() => {
  smoothT += (scrollT - smoothT) * (reducedMotion ? 1 : 0.08); // 減衰。reduced-motion ではカット扱い
  camera.position.copy(posCurve.getPointAt(smoothT));
  camera.lookAt(tgtCurve.getPointAt(smoothT, lookAt));
  renderer.render(scene, camera);
});
```

- `KEYS` は GLB 読み込み後（`size` 確定後）に作る
- 生成映像で作る（Higgsfield の scroll-scrub 方式）なら、`<video>` の `currentTime` をスクロール率で動かす。動画は **キーフレーム間隔の短いエンコード**にしないとシークがガタつく（例: `ffmpeg -i in.mp4 -g 15 -keyint_min 15 -movflags +faststart out.mp4`）

---

## 8. キャラクターのアニメーション（パターン E）

```js
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js'; // 同じキャラを複数出すときだけ

let mixer, actions = {};
// loader.load の成功コールバック内で:
mixer = new THREE.AnimationMixer(gltf.scene);
for (const clip of gltf.animations) actions[clip.name] = mixer.clipAction(clip);
actions.Idle?.play();
function wave() {
  const a = actions.Wave; if (!a) return;
  a.reset().setLoop(THREE.LoopOnce, 1).play();
  a.clampWhenFinished = true;
  mixer.addEventListener('finished', () => actions.Idle?.reset().play(), { once: true });
}
// ループ内: mixer?.update(clock.getDelta());  ※ const clock = new THREE.Clock();
```

- クリップ名（`Idle`, `Wave`）は GLB に入っている名前に合わせる。`gltf.animations.map(c => c.name)` で確認
- Higgsfield の `image_to_3d` / `3d_rigging` で付けたアニメーションは GLB に同梱される。複数クリップは 1 つの GLB にマージして渡すと扱いやすい
- reduced-motion では `Idle` を止めて静止ポーズにする

---

## 9. 軽さと堅牢さ（全パターン共通）

| 項目 | やること | 理由 |
|---|---|---|
| GLB サイズ | Draco 圧縮、テクスチャ WebP・2048px 以下、合計 10〜20 MB 以下 | 初回表示が 3 秒を超えると離脱する |
| 進捗表示 | `onProgress` でバー。ポスターは読み込み完了まで残す | 「壊れている」と思われない |
| ピクセル比 | `setPixelRatio(min(dpr, 2))` | 高 DPI スマホで GPU 負荷が 4 倍になる |
| リサイズ | `resize` でサイズと `aspect` を更新 | 端末回転で潰れない |
| フォールバック | WebGL 無しはポスターのまま。エラー時も同じ | 何も見えない状態を作らない |
| タッチ | ビューアは `touch-action: none`、スクロール連動は `pan-y` | ページスクロールと 3D 操作の喧嘩を防ぐ |
| 動きの配慮 | `prefers-reduced-motion` で自動回転・減衰を止める | 酔いやすい人への配慮。アクセシビリティ |
| 本文 | HTML に置く。Canvas に文字を描かない | 検索・共有・読み上げ |
| 後始末 | SPA なら `renderer.dispose()`、`setAnimationLoop(null)` | メモリリーク |

---

## 10. React で組むなら

React Three Fiber + drei。`useGLTF`（GLB 読み込み、Draco 対応）、`OrbitControls`、`Environment preset="studio"`、
`ScrollControls` / `useScroll`（スクロール連動）、`useAnimations`（クリップ再生）が上の §3〜8 に対応する。
**SSR（Next.js / TanStack Start）では Three.js をクライアント側だけで動かす**（動的 import か `useEffect` 内で初期化）。
Higgsfield の website テンプレート（TanStack Start SSR）に載せるときもここが要点。

---

## 11. QA の勘所（SKILL.md Step 4 の補足）

- **実機で見る。** デスクトップの DevTools のスマホ表示ではタッチの喧嘩は再現しない
- **ネットワークを絞って見る。** DevTools の「Fast 3G」で GLB の体感サイズが分かる
- **分解 → 戻す → クリック → 戻す** を 3 回繰り返して位置がずれないか
- **裏返った面**（黒く抜ける）はモデル側の法線の問題。`material.side = THREE.DoubleSide` は応急処置。根本は再生成か Blender で法線を直す
- **白飛び**は `renderer.toneMappingExposure` を 0.8 前後に落とす
- **共有プレビュー**は OG 画像の絶対 URL を確認。相対パスは多くの SNS で拾われない
