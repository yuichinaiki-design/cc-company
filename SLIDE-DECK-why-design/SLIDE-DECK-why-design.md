# SLIDE-DECK-why-design

このファイル1枚をAIツール（Claude Design、NotebookLM、Google Slides等）に渡すだけでスライドを生成できます。デザイン定義・レイアウトパターン・スライド構成の全情報がこのファイルに含まれています。

## Deck Info

    deck:
      title: "なぜデザインするのか ― デザイナーとしての本質"
      audience: "新人デザイナー"
      purpose: "教育・研修（ワークショップ）"
      slide_count: 8
      theme: "デザインの『なぜ』と、ジョハリの窓 × 量を持って質を制す"

---

## Design System

以下はSLIDE.mdのデザインシステム定義です。全スライドのデザインはこの定義に従ってください。

### Overview

**参照ソース：** 青　シンプル　グラフ　図解のプレゼンテーション.pdf（日本語プレゼンテーション）
**マッチするシーン：** 教育・研修資料、ビジネス発表・提案資料、グラフや図解を多用した情報整理型プレゼン

### Colors

| 役割 | カラー名 | HEXコード |
|---|---|---|
| Primary | スカイブルー | #29ABE2 |
| Secondary | ライトブルー | #A8DCF0 |
| Background | 白 | #FFFFFF |
| Accent | ほぼ黒 | #111111 |
| Text | ほぼ黒（本文） | #1A1A1A |

```yaml
colors:
  primary: "#29ABE2"
  secondary: "#A8DCF0"
  background: "#FFFFFF"
  accent: "#111111"
  text: "#1A1A1A"
```

### Typography

| 役割 | フォント | サイズ | ウェイト |
|---|---|---|---|
| 見出し（H1） | Noto Sans JP | 60px | Bold |
| 見出し（H2） | Noto Sans JP | 28px | Bold |
| 本文 | Noto Sans JP | 18px | Regular |
| キャプション | Noto Sans JP | 13px | Regular |

```yaml
typography:
  heading_h1:
    font: "Noto Sans JP"
    size: "60px"
    weight: "700"
  heading_h2:
    font: "Noto Sans JP"
    size: "28px"
    weight: "700"
  body:
    font: "Noto Sans JP"
    size: "18px"
    weight: "400"
  caption:
    font: "Noto Sans JP"
    size: "13px"
    weight: "400"
```

### Layout

- **スライドサイズ：** 16:9（幅960px × 高さ540px）
- **余白（上下）：** 48px
- **余白（左右）：** 60px
- **テキスト整列：** セクションタイトルは中央寄せ、本文は左寄せ

```yaml
layout:
  slide_size: "16:9"
  width: "960px"
  height: "540px"
  padding_vertical: "48px"
  padding_horizontal: "60px"
  text_align: "left"
```

### Slide Frame

スライドの全ページに共通して適用される「枠」の要素を定義します。各パターンはコンテンツエリアの構造のみを定義するため、タイトルエリア・ページ番号・装飾はすべてここで一括管理します。

**タイトルエリア：** 上部中央配置。点線（`·····`）で両側を挟んだブラケット形式で表示。例：`·············· [ なぜデザインするのか ] ··············`。コンテンツパネルの外側・上部に配置し、パネル内には含めない。
**ページ番号：** なし
**装飾：** 左上と右サイドに有機的なウェーブ形状（ブロブ）を Primary（#29ABE2）と Secondary（#A8DCF0）のグラデーションで配置。コンテンツスライドでは白いインナーパネル（border: 1.5px solid #CDD8E3）をブロブの前面に配置する。

```yaml
slide_frame:
  title_area:
    position: "top-center"
    text_align: "center"
    decoration: "dotted-bracket"
    format: "·· [ タイトル ] ··"
  page_number:
    position: "none"
    format: "none"
  decoration: "gradient-blob-top-left-and-right"
  inner_panel:
    border: "1.5px solid #CDD8E3"
    border_radius: "3px"
    padding: "24px 32px"
    margin: "0 60px 16px"
```

### Do / Don't

**Do（やること）**
- 左上と右サイドにウェーブ形状のブルーグラデーションブロブ装飾を配置する
- セクションタイトルは `[ タイトル ]` 形式で両側に点線を添え、上部中央に配置する
- コンテンツは白いインナーパネル（細いボーダー付き）の中に整理して表示する
- グラフ・表・アイコンカードなど視覚要素を積極的に活用する
- 数字付き黒丸バッジ（セクション番号）でコンテンツ間の階層を明示する

**Don't（やってはいけないこと）**
- テキストのみのスライドを作らず、必ず図解・グラフ・アイコン等の視覚要素を使う
- ブロブ以外の派手な装飾要素を追加して画面を混雑させない
- 原色や高彩度の色を追加してブルー系の統一感を損なわない
- フォント種類を増やしてタイポグラフィの統一感を壊さない

---

## Slide Patterns

以下は使用するスライドパターンの定義です。各スライドの「pattern:」に指定されたパターン名と照合してレイアウト構造を確認してください。

### Pattern: cover-title-center

**概要：** 大きなタイトルテキストとサブタイトルをスライド中央に配置し、装飾的な背景グラフィック（グラデーション・波形・図形）を組み合わせたカバースライドレイアウト
**適したシーン：** プレゼン・提案書の表紙、章の区切りスライド、セクション導入スライド

**Structure（構造）**

    structure:
      layout: full-slide-centered
      background:
        type: decorative-graphic (gradient, wave, shapes)
      center:
        elements:
          - main-title (large, bold)
          - sub-title (medium)

**Elements（各要素の役割）**

| 要素 | 配置 | 役割 |
|---|---|---|
| 背景装飾グラフィック | スライド全体 | ブランドらしさと視覚的インパクトを演出 |
| メインタイトル | 中央（大フォント） | スライドまたは章の主題を大きく表示 |
| サブタイトル | タイトル下 | 副題・説明文・キャッチコピー |

**注意点：** カバー専用デザイン（Slide Frameのタイトルエリアは使わない）。背景装飾はブランドカラーのグラデーションが定番。テキストは2行以内に。

---

### Pattern: key-message-single

**概要：** 1つの大きなキーメッセージをコンテンツエリア中央に配置する強調スライド。上下に細い区切り線を置き、さらに下部に補足テキストを表示する。
**適したシーン：** 重要な結論・発見・主張を強調する場面、章の締めくくり、印象付けたい1枚

**Structure（構造）**

    structure:
      layout: content-area-centered
      elements:
        - divider-line-top (short, #CCCCCC, 60px)
        - key-message (large, bold, centered, #333)
        - divider-line-bottom (short, #CCCCCC, 60px)
        - supplemental-text (small, muted, #888)

**Elements（各要素の役割）**

| 要素 | 配置 | 役割 |
|---|---|---|
| 上部区切り線 | キーメッセージの上 | 視線をメッセージに集中させるセパレータ |
| キーメッセージ | コンテンツエリア中央 | 最も伝えたい1文を大きく太く表示 |
| 下部区切り線 | キーメッセージの下 | メッセージの終わりを示すセパレータ |
| 補足テキスト | 下部区切り線の下 | キーメッセージの根拠・補足説明を小さく表示 |

**注意点：** キーメッセージは1文（最大2行）に。断言形にすると印象が強まる。補足テキストは省略可。

---

### Pattern: two-section-stacked-text

**概要：** コンテンツエリアを上下2セクションに分け、各セクションに見出し＋本文テキスト＋リストを配置する積み重ねテキストレイアウト。上段は見出し＋本文、下段は見出し＋本文＋番号付きリスト。
**適したシーン：** 背景説明と具体的なステップの組み合わせ、概要と手順の提示、課題と対応策のリスト

**Structure（構造）**

    structure:
      layout: content-area-two-section-stacked
      upper-section:
        elements:
          - heading (bold, border-left: 3px solid accent)
          - body-text (2〜3行)
      lower-section:
        elements:
          - heading (bold, border-left: 3px solid accent)
          - body-text (1行)
          - numbered-list (3項目)

**Elements（各要素の役割）**

| 要素 | 配置 | 役割 |
|---|---|---|
| 上段見出し | 上セクション上部 | 上段の主題を太字・左アクセントボーダー付きで表示 |
| 上段本文 | 上段見出しの下 | 2〜3行の説明。背景・概要・問題提起など |
| 区切り線 | 上段と下段の境界 | 2セクションを視覚的に分離 |
| 下段見出し | 下セクション上部 | 下段の主題を太字・左アクセントボーダー付きで表示 |
| 下段本文 | 下段見出しの下 | 1行の導入文 |
| 番号付きリスト | 下段本文の下 | 3項目の手順・ポイントを番号付きで整理 |

**注意点：** 上段・下段の高さが均等になるよう調整。下段リストは3項目が最適。

---

### Pattern: four-quadrant-center-circle

**概要：** スライド中央に大きな円を配置し、四隅（左上・右上・左下・右下）に各1つずつアイコン＋見出し＋説明テキストを配置する4象限レイアウト。中央の円が4つの要素を結びつけるハブの役割を持つ。
**適したシーン：** 1つの中心概念に関連する4要素の説明、4つの観点・視点の提示、マトリクス的な情報整理

**Structure（構造）**

    structure:
      layout: content-area-four-quadrant-center-circle
      center-circle:
        size: 120px × 120px, border-radius: 50%
        elements:
          - center-text (中心概念のキーワード、1〜2行)
      quadrant-grid:
        grid-template-columns: 1fr 1fr
        grid-template-rows: 1fr 1fr
      each-quadrant:
        elements:
          - icon-placeholder (円形, 40px)
          - heading (bold)
          - description (2〜3行)

**Elements（各要素の役割）**

| 要素 | 配置 | 役割 |
|---|---|---|
| 中央円 | コンテンツエリア中心 | 4要素を結びつける中心概念・テーマを円形で表現 |
| 中央テキスト | 円の内部 | 中心概念の名称・キーワードを小さく表示 |
| アイコン | 各象限上部 | 各要素を表すアイコン |
| 象限見出し | アイコン下 | 各象限の内容を太字で短く表示 |
| 象限説明 | 見出し下 | 各象限の詳細を2〜3行で記述 |

**注意点：** 中央円のテキストは1〜2語に簡潔に。4象限の文量をそろえるとバランスが良い。各象限のコンテンツは外寄りに配置。

---

### Pattern: four-step-flow

**概要：** 上部に中央揃えのタイトルを配置し、下部に4枚の等幅カードを横並びにしたフロー図レイアウト。各カードは番号バッジ・ラベル・イラストで構成され、カード間の矢印でステップの流れを示す。
**適したシーン：** プロセス・手順・ワークフローの説明。順序のある内容を視覚的に整理したいときに最適。

**Structure（構造）**

    structure:
      layout: four-column-flow
      columns: 4
      header:
        position: top-center
        role: スライド全体のタイトル
      cards:
        count: 4
        separator: arrow（▶、カード間に配置）
        card_elements:
          - badge: 番号（1〜4）、円形、アクセントカラー
          - label: ステップ名（1〜2行）
          - illustration: アイコン・イラスト

**Elements（各要素の役割）**

| 要素 | 配置 | 役割 |
|---|---|---|
| タイトル（H1） | スライド上部・中央揃え | スライド全体のテーマ |
| カード（×4） | 横並び・等幅 | 各ステップのコンテナ |
| 番号バッジ | 各カード上端中央 | ステップの順序（1〜4） |
| ステップラベル | 各カード中央上部 | そのステップで行うことの短い説明 |
| 矢印（▶） | カード間（計3箇所） | ステップの進行方向・順序の明示 |

**注意点：** ステップ数は4固定。番号バッジはアクセントカラー。ラベルは1〜2行に。

---

### Pattern: three-column-icon-card

**概要：** 3つの項目を等幅カードで横並びにし、各カードの上部にアイコン・下部に見出し・本文を配置する3列アイコンカードレイアウト
**適したシーン：** サービスの3つの特徴・強み・メリット、3つのターゲット、3つのステップ説明

**Structure（構造）**

    structure:
      layout: three-equal-columns
      card:
        top:
          elements: [icon (symbol or image)]
        middle:
          elements: [heading-h2]
        bottom:
          elements: [body-text or bullet-list]

**Elements（各要素の役割）**

| 要素 | 配置 | 役割 |
|---|---|---|
| アイコン | 各カード上部中央 | その項目を視覚的に表すシンボル |
| 見出し（H2） | アイコン下 | 項目のキーワード・タイトル |
| 本文 | 見出し下 | 詳細説明または箇条書き（2〜4行） |
| カード枠/背景 | 各カード全体 | 3項目の区切りと統一感を作る |

**注意点：** アイコンはSVGまたはテキストシンボル（★・✓・→など）で代用可。3列固定。カード間の余白を十分に。

---

### Pattern: numbered-list-with-body

**概要：** 3つの項目を縦に並べ、各項目に番号バッジ・見出し・本文を配置する縦リストレイアウト
**適したシーン：** 特徴・メリット・要素の列挙、優先度付きリスト、段階的な説明

**Structure（構造）**

    structure:
      layout: single-column-list
      items: 3
      item:
        left:
          type: badge (circle or hexagon or square)
          elements: [number]
        right:
          elements: [heading-h2, body-text]
      divider: horizontal-line between items

**Elements（各要素の役割）**

| 要素 | 配置 | 役割 |
|---|---|---|
| 番号バッジ | 各行左端 | 項目の順番・番号を視覚的に示す |
| 見出し（H2） | バッジ右・上部 | 各項目のキーワードや主張 |
| 本文 | 見出しの下 | 見出しを補足する説明文（1〜3行） |
| 区切り線 | 各行間 | 項目の区切りを明確にする |

**注意点：** 項目は3つが最適。見出しは短く（10字以内）、本文は2〜4行。

---

### Pattern: summary-three-points

**概要：** 「まとめ」スライド用のシンプルな3点ポイントリスト。チェックマーク付きで視認性が高く、プレゼンのクロージングに最適。
**適したシーン：** プレゼンのまとめ・要点の整理・議論の結論提示・次のアクションへの導入

**Structure（構造）**

```yaml
layout: summary-three-points
summary_label:
  text: "SUMMARY"
point_items:
  count: 3
  each:
    check_icon: { content: "✓", border: "2px solid #CCCCCC" }
    text_block:
      heading: { font_weight: bold, color: "#333" }
      body: { color: "#666" }
```

**Elements（各要素の役割）**

| 要素 | 役割 | 推奨文字数 |
|------|------|-----------|
| SUMMARYラベル | まとめスライドであることを明示する識別子 | 固定（"SUMMARY"） |
| チェックボックスアイコン（✓） | 各ポイントが確認済みであることを視覚的に示す | 固定（"✓"） |
| ポイント見出し | まとめの要点・結論を簡潔に記述 | 20〜35文字 |
| ポイント補足テキスト | 見出しを補完する詳細説明や根拠 | 30〜60文字 |

**注意点：** 3つのポイントは論理的な順序で。見出しは体言止めか短文で統一。

---

## Slides

各スライドの構成とコンテンツひな型です。「pattern:」に指定されたパターン定義を上記「Slide Patterns」から参照し、各エリアにコンテンツを入れてスライドを生成してください。

---

### Slide 1 — 表紙

    slide:
      number: 1
      type: "cover"
      pattern: "cover-title-center"

**コンテンツひな型：**
- メインタイトル：なぜデザインするのか
- サブタイトル：デザイナーとしての本質 ― 新人デザイナーのためのワークショップ

**AIへの指示：**
上記の「Design System」と「Pattern: cover-title-center」の定義に従い、このスライドを作成してください。ブランドカラー（#29ABE2／#A8DCF0）のグラデーションブロブを背景装飾に使い、中央に大きくタイトルを配置してください。

---

### Slide 2 — 問題提起：デザインへの誤解

    slide:
      number: 2
      type: "key-message"
      pattern: "key-message-single"

**コンテンツひな型：**
- キーメッセージ：デザインとは、「見た目を整える仕事」ではない。
- 補足テキスト：新人が最初につまずく誤解 ―― きれいに作れること＝良いデザイン、ではない。

**AIへの指示：**
上記の「Design System」と「Pattern: key-message-single」の定義に従い、このスライドを作成してください。キーメッセージを大きく中央に、上下の区切り線で挟んで強調してください。

---

### Slide 3 — 本質は「なぜ」から始まる

    slide:
      number: 3
      type: "bullets"
      pattern: "two-section-stacked-text"

**コンテンツひな型：**
- 上段見出し：デザインの本質は「なぜ作るのか」
- 上段本文：デザインは目的を達成するための手段。誰の、どんな課題を、どう解くのか。「なぜ」が抜けた装飾は、ただの自己満足になる。見た目は、目的に従う。
- 下段見出し：手を動かす前に問う、3つのこと
- 下段本文：作り始める前に、この3つを言葉にする。
- 番号付きリスト：
  1. 誰のためか（ユーザーは誰か）
  2. 何を解くのか（本当の課題は何か）
  3. どうなれば成功か（ゴールの定義）

**AIへの指示：**
上記の「Design System」と「Pattern: two-section-stacked-text」の定義に従い、このスライドを作成してください。上段で「本質＝なぜ」を提示し、下段で実践の3つの問いを番号付きリストで示してください。

---

### Slide 4 — ジョハリの窓：自分が見えている範囲は狭い

    slide:
      number: 4
      type: "diagram"
      pattern: "four-quadrant-center-circle"

**コンテンツひな型：**
- 中央円テキスト：ジョハリの窓
- 左上（アイコン：目）：見出し「開放の窓」／説明「自分も他者も気づいている、デザインの良し悪し。いま見えている範囲。実はとても狭い。」
- 右上（アイコン：虫めがね）：見出し「盲点の窓」／説明「他者には見えるが、自分では気づけない弱点。成長の伸びしろは、ここに眠っている。」
- 左下（アイコン：引き出し）：見出し「秘密の窓」／説明「自分の中にあるが、まだ形にして外に出していない引き出し・意図。出して初めて価値になる。」
- 右下（アイコン：星）：見出し「未知の窓」／説明「自分も他者もまだ知らない可能性。数をこなす中で、偶然に見つかる発見がある。」

**AIへの指示：**
上記の「Design System」と「Pattern: four-quadrant-center-circle」の定義に従い、このスライドを作成してください。中央円に「ジョハリの窓」、四隅に4つの窓を配置し、新人デザイナーの自己認識（開放の窓が狭い）を伝えてください。

---

### Slide 5 — 量を持って質を制す

    slide:
      number: 5
      type: "flow"
      pattern: "four-step-flow"

**コンテンツひな型：**
- タイトル：量をこなし、晒すほど「窓」は開く ― 量を持って質を制す
- ステップ1：量をつくる（完璧を待たず、とにかく数を打つ）
- ステップ2：外に晒す（人に見せる。FB前提でアウトプットを出す）
- ステップ3：フィードバックを受ける（盲点の窓が開く瞬間）
- ステップ4：質が上がる（開放の窓が広がり、再現性のある質へ）

**AIへの指示：**
上記の「Design System」と「Pattern: four-step-flow」の定義に従い、このスライドを作成してください。4枚のカードを矢印（▶）でつなぎ、「量→晒す→FB→質」が一本の流れであること、量が質に転化する仕組みを視覚化してください。

---

### Slide 6 — 新人がやるべき3つの実践

    slide:
      number: 6
      type: "cards"
      pattern: "three-column-icon-card"

**コンテンツひな型：**
- リード文：「なぜ」を問いながら、量をこなす ― 新人の3つの実践
- カード1（アイコン：✏️）：見出し「とにかく量を出す」／本文「迷ったら作る。完璧主義より、まず数。打席に立った回数が、そのまま引き出しになる。」
- カード2（アイコン：👁）：見出し「必ず晒す」／本文「自分だけで抱えない。早く・こまめに見せ、盲点を他者の目で開いてもらう。」
- カード3（アイコン：🔁）：見出し「なぜを言語化する」／本文「『なんとなく』で終わらせない。良い／悪いの理由を言葉にして、次に再現する。」

**AIへの指示：**
上記の「Design System」と「Pattern: three-column-icon-card」の定義に従い、このスライドを作成してください。3つの実践をアイコン付きカードで等価に並べてください。

---

### Slide 7 — 量を「質」に変える振り返りの型

    slide:
      number: 7
      type: "bullets"
      pattern: "numbered-list-with-body"

**コンテンツひな型：**
1. 見出し「言語化する」／本文「なぜこの色・配置・余白にしたのか。意図を言葉にできて初めて、選択は『技術』になる。」
2. 見出し「差分を見る」／本文「FB前と後、過去の自分と今。何が変わったかを比べると、盲点が学びに変わる。」
3. 見出し「次に活かす」／本文「気づきを次の1枚に必ず持ち込む。振り返りのない量は、ただの消耗で終わる。」

**AIへの指示：**
上記の「Design System」と「Pattern: numbered-list-with-body」の定義に従い、このスライドを作成してください。番号バッジ付きの縦リストで、「量を質に変える」ための3つの振り返りステップを示してください。

---

### Slide 8 — まとめ：なぜを問い、量で窓を開く

    slide:
      number: 8
      type: "summary"
      pattern: "summary-three-points"

**コンテンツひな型：**
- SUMMARYラベル：SUMMARY
- ポイント1：見出し「デザインは『なぜ』から始まる」／補足「見た目は手段。誰の何を解くのかを、最初に問う。」
- ポイント2：見出し「自分の見えている範囲は狭い」／補足「盲点の窓を、量と他者のフィードバックで開いていく。」
- ポイント3：見出し「量を持って質を制す」／補足「ただし振り返りとセットで。量は、質に転化する。」

**AIへの指示：**
上記の「Design System」と「Pattern: summary-three-points」の定義に従い、このスライドを作成してください。チェックマーク付きの3点で、ワークショップ全体の結論を締めくくってください。
