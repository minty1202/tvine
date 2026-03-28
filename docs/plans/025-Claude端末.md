# #25 Claude 端末（PTY + xterm.js）

## 完了時の状態

- セッション一覧でカードをクリックすると、中央エリアに Claude Code が起動して表示される
- xterm.js 上でそのまま Claude Code を操作できる（入力・許可確認・コード表示等）
- 別のセッションに切り替えると表示が切り替わり、前のプロセスはバックグラウンドで動き続ける
- 切り替え戻すと出力履歴が残った状態で表示される
- Claude Code が終了（`/exit` 等）したら、中央エリアに終了画面と再開ボタンが表示される
- tvine を再起動しても、セッション選択で再接続できる

## チェックリスト

- [ ] [kernel: PTY の trait 定義](#kernel-pty-の-trait-定義)
- [ ] [pty クレート: trait の実装](#pty-クレート-trait-の実装)
- [ ] [channel 層の新設](#channel-層の新設)
- [ ] [Tauri 層: IPC コマンドとイベント](#tauri-層-ipc-コマンドとイベント)
- [ ] [フロントエンド: xterm.js の表示と入力](#フロントエンド-xtermjs-の表示と入力)
- [ ] [セッション切り替え](#セッション切り替え)
- [ ] [終了検知と再開](#終了検知と再開)
- [ ] [セッション削除時の PTY 終了](#セッション削除時の-pty-終了)

## 未決

- xterm.js の入力互換性（Shift+Enter 等の特殊キー）は実装時に検証
- xterm.js の Terminal インスタンスの保持方法（React 外の `Map<SessionId, Terminal>` が候補。re-render との競合、`terminal.dispose()` のタイミング等を実装時に判断する）

## 方針

### アーキテクチャ

#### 方針

既存の `api` 層はリクエスト/レスポンス型（REST 的）の操作を担当している。PTY は双方向の持続的な通信（WebSocket 的）であり、性質が異なる。そのため `api` と並列に `channel` 層を新設し、双方向通信の処理を担当させる。

```
リクエスト/レスポンス: routes -> api     -> registry -> adapter -> kernel
双方向通信:           routes -> channel -> registry -> adapter -> kernel
```

依存の方向は既存と同じく外から内。kernel の trait は共通で、`api` と `channel` のどちらからも使える。`pty` クレートは `client` と同列のインフラ層で、adapter が kernel trait の実装に使う。

### kernel: PTY の trait 定義

#### 方針

- kernel に PTY 操作の trait を定義する
- `pty` クレートがこの trait を実装する（`client` クレートが `GitRepository` trait を実装するのと同じ構造）

#### 実装方法

- `kernel/src/service/pty.rs`（または適切なモジュール名）に trait を定義
- spawn は reader（`Box<dyn Read + Send>`）を返す。reader の扱い（読み取りループ等）は呼び出し側の責務
- write / resize / kill / has 等の操作を定義

### pty クレート: trait の実装

#### 方針

- `client` クレートと同列のインフラ層
- PTY ライブラリは `portable-pty`（Wez Furlong 作。クロスプラットフォーム対応、wezterm で実績あり）
- Tauri には依存しない。PTY の操作に専念する

#### 実装方法

##### クレート構成

- `crates/pty/` に配置
- workspace の `members` と `src-tauri/Cargo.toml` の `dependencies` に追加
- `portable-pty` を依存に追加

##### PtyProcess

- `portable-pty` で PTY を作成し、子プロセスとして Claude Code を起動
- 起動コマンド: 初回は `claude --session-id <uuid>`、再接続は `claude --resume <uuid>`
- 判断基準: session.json に `claude_launched: bool` フラグを持たせる。`false`（未起動）なら `--session-id`、`true`（起動済み）なら `--resume`。初回起動成功時に `true` に更新する
- 作業ディレクトリ: `session.worktree_path`
- writer（入力書き込み）とリサイズ用のハンドルを保持
- reader は spawn 時に呼び出し元に返す

##### PtyManager

- kernel の trait を実装する
- `HashMap<SessionId, PtyProcess>` でセッションごとのプロセスを管理
- 操作: spawn / write / resize / kill / has

### channel 層の新設

#### 方針

- `api` と並列に `channel` クレート（または `api` 内のモジュール）を新設する
- Web でいう WebSocket ハンドラーに相当する層
- PTY の spawn 時に reader を受け取り、読み取りループを起動する等のオーケストレーションを担当する
- registry 経由で kernel trait にアクセスする

#### 実装方法

- `channel` は registry を受け取り、kernel trait 経由で PTY を操作する
- spawn 時に返る reader を使って読み取りスレッドを起動する処理を担当
- routes から channel を呼ぶ形にする

### Tauri 層: IPC コマンドとイベント

#### 方針

- 既存の routes パターン（`src-tauri/src/routes/`）に合わせる
- PTY の出力は Tauri Event で push、入力は invoke で受ける
- routes は channel 層に委譲する

#### 実装方法

##### コマンド（フロントエンド → Rust）

| コマンド | 用途 |
| --- | --- |
| `spawn_pty(session_id)` | PTY 起動 |
| `write_pty(session_id, data)` | xterm.js の入力を PTY に書き込む |
| `resize_pty(session_id, cols, rows)` | ターミナルサイズ変更を反映 |

##### イベント（Rust → フロントエンド）

| イベント | payload | 用途 |
| --- | --- | --- |
| `pty-output` | `{ session_id, data }` | PTY 出力を xterm.js に送る |
| `pty-exit` | `{ session_id }` | プロセス終了通知 |

- 全セッションの出力を単一イベントに流す（セッション数は数個〜十数個の想定で問題ない）
- `PtyManager` を `Arc<std::sync::Mutex<>>` で Tauri state として共有
- spawn 時に `app_handle` を渡して、読み取りスレッドから `emit` できるようにする
- 読み取りスレッドは `std::thread::spawn` で起動。`AppHandle` は `Send + Sync` なのでスレッド間で安全に使える

### フロントエンド: xterm.js の表示と入力

#### 方針

- `xterm` + `@xterm/addon-fit` を導入
- `src/features/terminal/` に配置
- xterm.js の初期化・イベントリスナーはカスタム hook に隠蔽（CLAUDE.md: コンポーネント内で `useEffect` を直接書かない）
- 詳細は実装時に調整する前提

#### 実装方法

- `ClaudeTerminal` コンポーネントをメインエリアに配置
- `pty-output` イベントをリッスンし、`session_id` が一致するデータを `terminal.write()` に渡す
- xterm.js の `onData` で入力を受け取り、`invoke("write_pty")` で送信
- xterm.js の `onResize` + `@xterm/addon-fit` でサイズ変更を検知し、`invoke("resize_pty")` で送信

### セッション切り替え

#### 方針

- セッションごとに xterm.js の `Terminal` インスタンスを保持する
- 切り替え時は表示だけを差し替え、前のプロセスはバックグラウンドで継続
- 出力バッファは Terminal インスタンスに残るので、戻したときに履歴が見える

#### 実装方法

- セッション切り替え時に、対象セッションの Terminal インスタンスを DOM コンテナに `terminal.open(element)` し直す
- Terminal インスタンスの保持方法は未決（上記参照）

### 終了検知と再開

#### 方針

- PTY の読み取りループで EOF を検知したらプロセス終了と判断する
- 終了後は xterm.js エリアに終了画面 + 再開ボタンを表示する
- カード選択と再起動は混ぜない（カードは「表示の切り替え」、再開は「終了画面上の明示的操作」）

#### 実装方法

- EOF 検知で `pty-exit` イベントを emit
- フロントエンドで `pty-exit` を受け取り、終了画面に差し替え
- 再開ボタンで `spawn_pty(sessionId)` を再呼び出し

### セッション削除時の PTY 終了

#### 方針

- セッション削除時に PTY プロセスが起動中であれば、先に kill してから worktree・session.json を削除する

#### 実装方法

- routes 層で channel（PTY 終了）-> api handler（delete_session）の順に呼ぶ
- api handler は PTY を知らないままで良い

## 実装順

1. kernel: PTY の trait 定義
2. pty クレート: trait の実装
3. channel 層の新設
4. Tauri IPC（routes + イベント）
5. フロントエンド（xterm.js 表示 + 入力）
6. セッション切り替え
7. 終了検知と再開
8. セッション削除時の PTY 終了
