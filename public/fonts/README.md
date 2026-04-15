# 日本語フォント

ffmpegの `drawtext` は fontfile 指定が必要なため、日本語対応フォントを配置してください。

推奨: **Noto Sans JP** (SIL Open Font License, 商用利用可)

1. https://fonts.google.com/noto/specimen/Noto+Sans+JP からDL
2. `NotoSansJP-Bold.ttf` を本ディレクトリに配置

ファイルが無い場合、タイトル/メッセージは英数字のみ正しく描画されます。
コードは `src/utils/movieGenerator.ts` で参照しています。
