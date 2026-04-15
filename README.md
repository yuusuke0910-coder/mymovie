# MyMovie — 自動ムービー作成PWA

写真・動画をアップロードしてオリジナル動画を自動生成するWebアプリ。
ブラウザだけで完結（FFmpeg.wasm）、PWA対応、GitHub Pagesでデプロイ可能。

## 技術スタック

- React 18 + TypeScript + Vite
- Tailwind CSS (ダークテーマ: `#1e2235` / `#f5a623`)
- FFmpeg.wasm (`@ffmpeg/ffmpeg`)
- vite-plugin-pwa (Workbox)
- coi-serviceworker (COEP/CORP 付与で SharedArrayBuffer 有効化)

## 機能

- 📸 写真/動画の複数アップロード & ドラッグ並び替え
- 🎛 完成尺プリセット (30s/1m/1m30s/2m/カスタム)
- ✍️ タイトル & メッセージ (フォントサイズ/色)
- 🎵 BGM選択 + 試聴 + 音量
- 🎬 720p MP4 出力 (ケンバーンズ / xfade / BGMフェードアウト)
- 📲 PWA (ホーム画面追加 / Workbox キャッシュ / オフライン検知)

## セットアップ

```bash
npm install
npm run dev
```

ローカル開発は `localhost` が CrossOriginIsolated 扱いになるよう、
`vite.config.ts` で COOP/COEP ヘッダーを付与済みです。

## GitHub Pages デプロイ

1. GitHub に `mymovie` という名前のリポジトリを作成して push

   ```bash
   git init
   git add .
   git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/<YOUR_NAME>/mymovie.git
   git push -u origin main
   ```

2. リポジトリの **Settings → Pages → Source** を **GitHub Actions** に設定

3. `main` に push すると `.github/workflows/deploy.yml` が自動で build→deploy

   デプロイ後のURL: `https://<YOUR_NAME>.github.io/mymovie/`

### 手動デプロイ (gh-pages ブランチ)

GitHub Actions を使わない場合:

```bash
npm run deploy
```

## COEP/CORP 問題について

GitHub Pages ではカスタムHTTPヘッダー (COEP/COOP) を設定できないため、
そのままだと SharedArrayBuffer が使えず FFmpeg.wasm の MT 版が動きません。
本プロジェクトでは `src/sw.ts` (vite-plugin-pwa の injectManifest) で
Service Worker による COEP/COOP ヘッダー注入を行い CrossOriginIsolation を有効化します。
初回訪問時は SW 登録後に1度だけ自動リロードして COEP を有効化します。
万が一 isolation に失敗した場合は `useFFmpeg` が自動で ST版 (`@ffmpeg/core`) に
フォールバックします。

## BGM ファイル

`public/bgm/` に Pixabay などの著作権フリーmp3を配置してください。
詳細は `public/bgm/README.md` を参照。

## ディレクトリ

```
.github/workflows/deploy.yml     GitHub Actions デプロイ
public/
  coi-serviceworker.js           COEP/COOP 付与用 SW
  bgm/*.mp3                      BGM素材
  icons/icon-{192,512}.png       PWAアイコン
src/
  components/                    MediaUploader / MovieSettings / TextBGMSettings / GeneratePreview / PWAInstallBanner
  hooks/                         useFFmpeg / usePWAInstall
  utils/movieGenerator.ts        FFmpeg.wasm でのムービー生成ロジック
  data/bgm.ts                    BGM リスト定義
  App.tsx
  main.tsx
```
