# tvine

Worktree × AI 並列開発ツール。Tauri デスクトップアプリ（Rust バックエンド + React/TypeScript フロントエンド）。

## ドキュメント

- 設計ドキュメントは `docs/design/mvp/` にある。実装前に必ず参照すること。
- `docs/notes/mvp/architecture.md` に技術スタックとアーキテクチャ概要がある。
- `docs/notes/mvp/mockup-mvp.html` にレイアウトの動作モックアップがある。

## 技術スタック

- Tauri (Rust + TypeScript)
- React + TypeScript
- Mantine v8（UI コンポーネント）
- Zustand（UI 状態管理、`src/stores/`）
- TanStack Query（データ取得・キャッシュ）
- xterm.js（ターミナル表示）

## TypeScript 規約

### interface vs type

- `interface` — コンポーネントの Props（外部との契約）
- `type` — それ以外すべて（store の状態、union、utility 等）

### Props の命名

- `ComponentNameProps`（Mantine の慣例に合わせる）

### import パス

- `@/` エイリアスを使う（`src/` を指す）
- `index.ts` による re-export はしない

## フロントエンド構成

- `src/app/` — エントリポイント、レイアウト
- `src/features/` — 機能単位（feature 間の相互参照は禁止）
- `src/components/` — 共有コンポーネント
- `src/stores/` — Zustand ストア
- `src/config/` — 設定（テーマ等）
- `src/hooks/` — 共有 hooks
- `src/lib/` — 外部ライブラリのラッパー

Bulletproof React を参考にした feature ベース構成。

## UI 設計方針

- ダークモードのみ
- 単位は px（デスクトップアプリのためブラウザのフォントサイズに依存しない）
- 8px グリッドシステム
- フォント: JetBrains Mono + Hiragino Sans（fallback）。フォントは配布しない。
- デザイントークンは `src/config/theme/tokens.ts`（Mantine の `other` は使わない）
- Compound component パターン（`Panel.Header` 等）は `Object.assign` で実装

## 開発方針

### フロントエンド

- 具体から作り、パターンが見えてから抽象化する（premature abstraction を避ける）
- 過度な汎用化・先回りした設計はしない

### バックエンド（Rust）

- kernel（ドメインモデル・trait）から外側へ向かって作る
- 依存の方向は外→内（adapter → kernel）
