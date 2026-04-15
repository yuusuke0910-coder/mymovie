# アプリアイコン

PWA用のアイコンを配置してください:

- icon-192.png (192x192)
- icon-512.png (512x512)

manifest.json（vite.config.ts内）から参照されます。
簡易な生成例としては、ブランド色 #1e2235 背景 + オレンジ #f5a623 の再生マークが推奨です。
`npx pwa-asset-generator public/favicon.svg public/icons` などで一括生成可能。
