---
name: design-and-plan
description: 「実装計画から始めます」等、新しい機能や Issue の設計・実装計画を始めるときに使用する
---

# 設計と実装計画

CLAUDE.md の「開発サイクル」ステップ 1〜4 を superpowers を使って実行するスキル。superpowers の流れをベースに、このプロジェクトの規約で上書きする。

## 全体の流れ

1. **main でスコープを決める** — `docs/design/mvp/` と現在のコード・Issue を確認し、次に何を作るか相談する
2. **GitHub Issue を作成** — スコープと完了条件を書く（実装計画には書かない）
3. **ブランチを切る** — `feature/<issue番号>`
4. **superpowers:brainstorming を実行** — 下記の上書きルールを適用
5. **実装計画を作成** — superpowers:writing-plans を実行し、下記の上書きルールを適用
6. **Issue と実装計画を紐づける** — Issue に `## 設計・実装計画` セクションを追加

## superpowers:brainstorming への上書き

- **完了時の姿を最初に提示する** — 技術詳細より先に「完了したらユーザーから見てどう動くか」を書く
- **設計議論の結果は実装計画に書く** — `docs/design/mvp/` は「何を作るか」、`docs/plans/` は「どう作るか」。brainstorming で議論した技術判断は実装計画の方に反映する
- **spec レビュー** — superpowers:brainstorming のサブエージェントレビューを実行する

## superpowers:writing-plans への上書き

- **配置先** — `docs/plans/<issue番号>-<概要>.md`（`docs/superpowers/plans/` は使わない）
- **フォーマット** — `docs/plans/ガイド.md` に従う。独自のフォーマットを定義しない
- **plan レビュー** — superpowers:writing-plans のサブエージェントレビューを実行する
- **TDD 前提にしない** — テスト方針は CLAUDE.md に従う
- **粒度** — 意味のあるまとまり単位。writing-plans の 2-5 分単位にしない

## ドキュメントの役割分担

| 場所 | 役割 |
| --- | --- |
| GitHub Issue | スコープと完了条件 |
| `docs/design/mvp/` | 何を作るか（機能の仕様） |
| `docs/plans/<issue番号>-<概要>.md` | どう作るか（技術判断・実装方法） |
| `docs/plans/todo.md` | まだ Issue にしていない対応事項 |
| `CLAUDE.md` | プロジェクト全体の規約 |

新しいディレクトリを勝手に作らない。既存の構造を確認してから動く。

## Issue 作成のルール

- 根拠のない親 Issue 参照を書かない
- スコープ外には関連 Issue 番号をリンクする（例: `→ #26`）
- 設計書リンクは `## 設計・実装計画` セクションに書く

## 議論の中で生まれた TODO

brainstorming の議論中に「今はやらないが後でやるべきこと」が出てきたら、`docs/plans/todo.md` に追記するか、Issue を作成する。

## スキル自体の振り返り

実装計画の作成が完了したら、このスキルの流れにズレや改善点がなかったか振り返り、必要に応じてこのファイルを更新する。
