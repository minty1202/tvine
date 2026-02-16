# Claude 端末

## 概要

中央エリアに表示される、選択中セッションの Claude Code。
PTY + xterm.js でそのまま表示し、Claude Code の体験をそのまま提供する。

## 表示方式

Claude Code を PTY（疑似端末）経由で起動し、xterm.js にそのまま表示する。

- tvine が Claude Code の出力をパース・レンダリングする必要がない
- 許可確認、コード表示、ショートカット等、Claude Code の UI がそのまま動く
- Claude Code のアップデートに影響を受けない
- 個人の Claude Code 設定がそのまま反映される

## 起動

セッション選択時に起動する。既にプロセスが起動済みなら表示を切り替えるだけ。

- 初回: `claude --session-id <uuid> --plugin-dir ~/.tvine/plugin`
- 再接続: `claude --resume <uuid> --plugin-dir ~/.tvine/plugin`

session-id は tvine がセッション作成時に UUID を生成し、session.json に保存する。
`--session-id` で Claude Code に渡すことで、tvine 側で ID を制御できる。
hooks の書き込み先（status.json のパス）も起動前に確定する。

- 作業ディレクトリは worktree のパス

## 入力

xterm.js に直接入力する。専用の入力バーは設けない。

## セッション切り替え

セッション一覧で別のセッションをクリックしたとき：

- 表示を選択したセッションの xterm.js に切り替える
- 前のセッションの Claude Code プロセスはバックグラウンドで動き続ける

## 再接続

tvine 再起動時：

- 保存されたセッション情報からセッション一覧を復元する
- セッション選択時に `claude --resume <session-id> --plugin-dir ~/.tvine/plugin` で再接続する

## tvine クラッシュ時の挙動

tvine が異常終了した場合、Claude Code プロセスの生死は PTY の実装に依存する（要検証）：

- **Claude Code が生き残っている場合**: tvine 再起動後に PTY を再接続する方法の検討が必要。実装時に検証する
- **Claude Code も死んでいる場合**: `--resume` で新しいプロセスとして再起動すれば、以前のセッションの会話が復元される
