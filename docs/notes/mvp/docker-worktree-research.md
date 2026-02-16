# Docker + Worktree 並行開発 調査レポート

## 背景

tvine で複数の worktree × Claude Code を同時実行する場合、Docker 環境（特に DB）をどう扱うかが課題。

---

## Boris Cherny（Claude Code 作者）の発言

### ソース
- [Tips スレッド](https://www.threads.com/@boris_cherny/post/DUMZsVuksVv/do-more-in-parallel-spin-up-git-worktrees-at-once-each-running-its-own-claude)
- [Setup スレッド](https://www.threads.com/@boris_cherny/post/DTBVlMIkpcm/im-boris-and-i-created-claude-code-lots-of-people-have-asked-how-i-use-claude)
- [Multi-clauding スレッド](https://www.threads.com/@boris_cherny/post/DRgN7YIEZiA/local-multi-clauding-is-powered-by-git-worktrees-under-the-hood-any-time-you)
- [InfoQ まとめ](https://www.infoq.com/news/2026/01/claude-code-creator-workflow/)

### 要点
- チーム推奨: 3〜5 個の worktree を同時に立ち上げ、各セッションで Claude Code を並列実行。「最大の生産性向上策」
- Boris 本人は worktree ではなく **multiple git checkouts**（= git clone を複数）を使用
- Claude Desktop はセッション作成時に自動で worktree を作る（`~/.claude-worktrees` に保存）
- Docker との共存については言及なし

### "multiple git checkouts" とは
git の機能名ではなく、同じリポジトリを `git clone` で複数ディレクトリに持つことを指す表現。worktree より独立性が高い（.git も独立）。

---

## Docker + Worktree で起きる問題

1. **ポート衝突** — 複数の worktree で `docker compose up` すると同じホストポートを取り合う
2. **コンテナ名衝突** — COMPOSE_PROJECT_NAME がデフォルトではディレクトリ名ベース
3. **ボリューム衝突** — named volume が共有されてデータが混ざる
4. **DB スキーマ差異** — worktree ごとにマイグレーションが異なる場合、共有 DB だと壊れる

---

## ポート衝突の解決策一覧

| 方式 | 概要 | トレードオフ |
|------|------|-------------|
| 手動オフセット | main=3000, feat-a=3001 等 | シンプルだが手動管理 |
| 計算式ベース | BASE + (index × 10) + offset | 予測可能・自動化向き |
| 動的ポート | ホスト側ポート省略、Docker が自動割当 | 衝突ゼロだがポートが毎回変わる |
| リバースプロキシ | Traefik/nginx でホスト名ルーティング | エレガントだが複雑 |
| ループバックアドレス | 127.0.0.1/127.0.0.2 で同じポートを分離 | 手軽だが知名度低い |

---

## docker-compose の標準的な仕組み

### COMPOSE_PROJECT_NAME
- コンテナ名・ネットワーク・ボリュームの名前空間を分離する最重要設定
- `.env` に書けば `docker compose up` だけで反映される

### 環境変数によるポート変数化
```yaml
ports:
  - "${WEB_PORT:-3000}:3000"
```
デフォルト値付きで、.env から上書き可能。

### docker-compose.override.yml
- docker-compose が自動で読み込むオーバーライドファイル
- `.gitignore` に入れて worktree ごとにカスタマイズ
- **注意**: 既に開発者が自分用に使っていることが多く、tvine と競合する可能性

### COMPOSE_FILE 環境変数
```env
COMPOSE_FILE=docker-compose.yml:docker-compose.override.yml:docker-compose.tvine.yml
```
複数ファイルを指定して読み込み順を制御。ただし仕組みを忘れがち。

### Profiles
```yaml
services:
  db:
    profiles: ["with-db"]
```
`docker compose --profile with-db up` で選択的にサービスを起動。

---

## 開発者が自然にたどり着くパターン

1. `docker compose up` → ポート衝突エラー
2. compose.yml のポートを直接変更 → コミットできない差分（NG）
3. ポートを環境変数化 + `.env` で上書き
4. `COMPOSE_PROJECT_NAME` を `.env` に設定（コンテナ・ボリュームも分離）
5. `.env` を `.gitignore`、`.env.example` をコミット

最終的に「`.env` + COMPOSE_PROJECT_NAME + 環境変数ポート」に落ち着く。

---

## tvine での方針検討

### ユーザーの設計原則
- tvine はサポートツール。ワークフローを強制しない
- 使われる仕組みは標準的・よく知られたものであること
- tvine がなくても成立する方法であること（魔法にしない）
- ユーザーが何が起きているか理解できること

### 2つの運用モード（案）

**共有 DB モード**（通常の開発）:
- main ブランチで DB 含む全サービスが常駐
- worktree では DB を除外して起動（`--no-deps` や profiles）
- worktree のアプリは main の DB に接続

**独立 DB モード**（DB 変更を伴う開発）:
- worktree ごとに独立した DB を含めて起動
- マイグレーション競合を回避

### 未解決の課題
- override.yml を既に使っている開発者との共存
- COMPOSE_FILE 等の仕組みは忘れやすい（「魔法」になりがち）
- worktree の使い捨て性質と Docker 環境の永続化のジレンマ
- clone 方式の方がシンプルかもしれない（Boris 自身も clone 派）

---

## 既存ツール

| ツール | アプローチ |
|--------|-----------|
| [sprout](https://github.com/SecDev-Lab/sprout) | `.env.example` に `{{ auto_port() }}` でポート自動割り当て |
| [wtm](https://fabiorehm.com/blog/2025/11/27/working-on-multiple-branches-without-losing-my-mind/) | ポート範囲チェック + `.env` コピー + PORT 動的割り当て |
| [docker-env](https://github.com/marcinhlybin/docker-env) | ブランチごとの Docker Compose 環境管理 |

---

## 参考リンク

- [Oliver Davies — Git Worktrees and Docker Compose](https://www.oliverdavies.uk/daily/2022/08/12/git-worktrees-docker-compose)
- [fsck.sh — Using Git Worktrees to Automate Development Environments](https://fsck.sh/en/blog/git-worktree/)
- [fabiorehm.com — Working on Multiple Branches Without Losing My Mind](https://fabiorehm.com/blog/2025/11/27/working-on-multiple-branches-without-losing-my-mind/)
- [incident.io — Shipping faster with Claude Code and Git Worktrees](https://incident.io/blog/shipping-faster-with-claude-code-and-git-worktrees)
- [SangyHan — Supercharging Claude Code with Git Worktrees and Docker](https://sangyh.com/posts/productivity/claude-code-with-git-worktrees/)
- [Docker Docs — Specify a project name](https://docs.docker.com/compose/how-tos/project-name/)
- [Docker Docs — Service profiles](https://docs.docker.com/compose/how-tos/profiles/)
- [anthropics/claude-code#1052 — Field notes: git worktree pattern](https://github.com/anthropics/claude-code/issues/1052)
