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
- Jotai（状態管理）
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
- `src/stores/` — ドメイン状態の Jotai atom
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

## Jotai atom の配置

- ドメイン状態（セッション、ステータス等）→ `src/stores/`
- UI の仕組みに閉じた状態（パネル開閉等）→ 使用するコンポーネントに co-locate（例: `src/components/panel/store.ts`）

## 開発方針

### フロントエンド

- 具体から作り、パターンが見えてから抽象化する（premature abstraction を避ける）
- 過度な汎用化・先回りした設計はしない
- コンポーネント内で `useEffect` を直接書かない。副作用はカスタム hook に隠蔽する

### バックエンド（Rust）

- kernel（ドメインモデル・trait）から外側へ向かって作る
- 依存の方向は外→内（adapter → kernel）
- Rust のコードはユーザーが書く（学習目的）。Claude Code はコードを書かない
- サンプルコードはユーザーが求めた時だけ提示する
- ユーザーが書き終わったらレビューする。実務的な視点も含めてコメントし、前提がひっくり返る指摘もOK

## テスト方針

### フロントエンド

テストする:
- ビジネスロジック（全て）
- UI のロジック（状態変化を伴う動き）

テストしない:
- 描画のみ（コンポーネントの配置、見た目）

基本はコンポーネント結合テストで検証する。単体テストは結合テストでカバーしきれない複雑なロジックが出てきた時に足す。

### バックエンド（Rust）

（未定）

## 開発サイクル

1. **main でスコープを決める** — docs と現在のコードをもとに、次のブランチで何を作るか決める
2. **GitHub Issue を作成** — スコープと完了条件を書く
3. **ブランチを切る** — Issue 番号を含める（例: `feature/3`）
4. **実装計画を作成** — ブランチ上で `docs/plans/<issue番号>-<概要>.md`（例: `003-セッション管理.md`） に実装の順序・技術判断を書く。Issue から実装計画ファイルへリンクする
5. **PR を出す前に `/usr/bin/make ci` を実行**して、lint・テストが通ることを確認する
6. **PR・マージ**

実装計画ファイルはマージ後も残す（実装判断の記録として）。

## Claude Code の注意事項

- `make` コマンドはシェル関数との衝突で使えない。`/usr/bin/make` を使うこと

## PR 運用

- ユーザーの指示でブランチを切って開発した PR には `🤖 Generated with Claude Code` の表記をつけない
- Claude が単独で issue や PR を作成した場合のみつける
