# インストール手順

## 前提条件

- Rust ツールチェイン（`rustup` 経由）
- Node.js 22+
- pnpm 10+

## cargo install でインストール

```bash
cargo install --git https://github.com/minty1202/tvine
```

`dist/` が存在しない場合、`build.rs` が自動で `pnpm install` + `pnpm build` を実行する。

## 開発環境のセットアップ

```bash
git clone https://github.com/minty1202/tvine.git
cd tvine
pnpm install
cargo tauri dev
```
