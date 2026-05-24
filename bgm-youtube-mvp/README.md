# bgm-youtube-mvp

毎日1本、AI生成のBGM動画を作って自動でYouTubeにアップロードするMVP。

```
Prompt → MusicGen で短いクリップ生成 → ループで N 分尺に拡張
       → 静止画と合成して MP4 → YouTube Data API でアップロード
```

## 必要環境

- Python 3.10+
- ffmpeg（`apt install ffmpeg` などで）
- **NVIDIA GPU (VRAM 8 GB 以上推奨)** — MusicGen-medium を CPU で回すと1クリップ数十分かかります
- YouTube Data API v3 を有効化した Google Cloud プロジェクト

## セットアップ

```bash
cd bgm-youtube-mvp
python -m venv .venv && source .venv/bin/activate

# torch は CUDA バージョンに合わせて入れる
pip install torch==2.1.0 --index-url https://download.pytorch.org/whl/cu121
pip install -r requirements.txt

cp .env.example .env
# .env を編集
```

### YouTube OAuth の準備

1. https://console.cloud.google.com/ で新規プロジェクトを作る
2. 「APIとサービス → ライブラリ」で **YouTube Data API v3** を有効化
3. 「認証情報 → OAuth クライアントID」で **デスクトップアプリ** を作成
4. JSON をダウンロードし `client_secret.json` として保存
5. ブラウザのある端末で初回認証:
   ```bash
   python -m scripts.auth_youtube
   ```
6. `token.json` が生成されればOK（以降は無人で動く）

> ヘッドレスサーバで動かす場合は、いったん手元で `token.json` を取得して `scp` で転送するのが楽です。

## 動かす

### スモークテスト（生成だけ・アップロードしない）

```bash
make test
# output/<date>/<run_id>/<run_id>.mp4 ができれば成功
```

### 本番1回ぶん

```bash
make run            # 生成 → アップロード
make run-no-upload  # 生成だけ
```

### 毎日自動実行

cron で：
```bash
crontab cron/crontab.example
```

または GitHub Actions（セルフホスト GPU ランナーが必要）：
`.github/workflows/daily-upload.yml` を参照。

## 設定

`config.yaml` で全部いじれる主要項目：

| キー | 意味 | デフォルト |
|------|------|----------|
| `generation.model` | MusicGen モデル | `facebook/musicgen-medium` |
| `generation.clip_seconds` | 1クリップの長さ（max 30s） | 30 |
| `generation.clips_per_video` | 1動画あたりのクリップ数 | 4 |
| `video.target_minutes` | 動画の長さ（分） | 60 |
| `video.loop_crossfade_ms` | ループ時のクロスフェード | 2000 |
| `youtube.privacy` | private/unlisted/public | private |

プロンプトは `prompts/prompts.txt` に1行1個で書きます。デフォルトでは日付ベースでローテーションします。

## ディレクトリ

```
bgm-youtube-mvp/
├── config.yaml              # 全パラメータ
├── prompts/prompts.txt      # プロンプトリスト
├── assets/                  # 背景画像を置く
├── src/
│   ├── config.py
│   ├── generator.py         # MusicGen
│   ├── video.py             # ループ + MP4
│   ├── metadata.py          # title/desc/tags
│   ├── youtube.py           # Data API
│   └── pipeline.py          # オーケストレーション
├── scripts/
│   ├── auth_youtube.py
│   └── test_generate.py
├── cron/crontab.example
└── .github/workflows/daily-upload.yml
```

## 収益化のリアル

ざっくり押さえておくべきこと：

1. **YouTube パートナープログラム (YPP) 加入条件**: 登録者1,000人 + 直近12か月の総視聴時間4,000時間（またはShorts 1,000万再生）。長尺BGMは視聴時間が稼ぎやすい一方、登録者は伸びにくいので登録誘導の工夫が要ります。
2. **AI 生成コンテンツの開示**: YouTube は「合成/改変コンテンツ」のチェック項目を提供しています。AI生成BGMは原則ここを正直に申告。
3. **MusicGen のライセンス**: モデル重み配布は **CC-BY-NC 4.0**（非商用）です。商用配信は学術的にもグレーで、YouTube 収益化が「商用」にあたるかは解釈の余地があります。安全策としては：
   - 生成後に **自分でアレンジを加える**（DAWでMix、楽器を追加など派生作品化）
   - **Stable Audio API** / **Suno API** など商用ライセンスのある生成サービスへ切り替える
   - ライセンスを許諾するモデル（例: `facebook/musicgen-melody` の派生など、商用可OSSモデル）に切替
4. **ファーミング扱い対策**: 同じ静止画＋AI BGMを大量投稿すると「Reused/Spam Content」と見なされ収益化が止まることがあります。背景・タイトル・サムネに差をつける、概要欄に作成プロセスを明記、コミュニティタブで補足、などが効きます。
5. **著作権スキャン (Content ID)**: 生成物が偶然既存曲と類似すると申し立てを食らう可能性ゼロではないので、初回はいくつか `private` で上げて Studio の「著作権チェック」を確認するのが安全。

→ MVP 完成後、**ライセンス互換と AI 開示** をクリアしてから `public` に切り替えてください。

## 既知の制約 / 次の一手

- MusicGen は1クリップ最大30秒。長くするには連結＋ループしているので、繰り返し感が出ます。次の改善は:
  - `generate_continuation()` を使って前のクリップを継続させる
  - 複数プロンプトで起伏を作る（Aメロ/Bメロ的に）
- 動画は静止画1枚。サムネと中身のバリエーションを増やすために `thumbnail.py` を追加するのが次のステップ。
- スケジューリングは cron / GitHub Actions の最小構成。Cloudflare Workers + 別 GPU バックエンドなど分離する余地あり。

## ライセンス

このリポジトリのコード: MIT。
生成された音源・動画のライセンスは利用したモデルに従ってください（MusicGen は CC-BY-NC 4.0）。
