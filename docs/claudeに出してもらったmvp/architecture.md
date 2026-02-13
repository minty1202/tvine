# tvine MVP アーキテクチャ

## 全体構成

```
┌─────────────────────────────────────────────────┐
│ Tauri アプリ                                     │
│                                                  │
│  ┌──────────────────────────────────────┐        │
│  │ フロントエンド (React + TypeScript)   │        │
│  │  - Sessions サイドバー               │        │
│  │  - xterm.js (Claude CLI表示)         │        │
│  │  - Changes パネル (unified diff)     │        │
│  │  - Terminal パネル (PTY)             │        │
│  │  - モーダル類                        │        │
│  └──────────────┬───────────────────────┘        │
│                 │ Tauri IPC (invoke)             │
│  ┌──────────────▼───────────────────────┐        │
│  │ バックエンド (Rust)                   │        │
│  │  - worktree管理 (git worktree)       │        │
│  │  - Claude CLIプロセス管理 (PTY)      │        │
│  │  - git diff 取得                     │        │
│  │  - Unix socket (hooks受信)           │        │
│  │  - セッション状態管理                │        │
│  └──────────────────────────────────────┘        │
└─────────────────────────────────────────────────┘
```

## Claude Code 連携方式（PTY）

Claude CLIをPTY（疑似端末）経由で起動し、xterm.jsにそのまま表示する。

- tvineがClaude CLIの出力をパース・レンダリングする必要がない
- 許可確認、コード表示、ショートカットなど全てClaude CLIのUIがそのまま動く
- resume は Claude Code の `--resume <session-id>` をそのまま利用
- Claude CLIのアップデートに影響を受けない

### 起動コマンド

```bash
claude --resume <session-id> --settings ~/.tvine/hooks/settings.json
```

- `--resume`: セッションの継続（tvine再起動時も復帰可能）
- `--settings`: tvine専用のhook設定を追加読み込み（プロジェクト既存の設定はそのまま維持）

## ステータス管理

セッションの状態（実行中 / 入力待ち / 停止）を2つの方法で取得する。

### 1. Hooks（リアルタイム）

Claude Codeのhooks機能でイベント発火時にtvineに通知。

| 状態 | 検出するHookイベント |
|---|---|
| 実行中 | `PreToolUse` / `PostToolUse` |
| 入力待ち | `Notification`（idle_prompt） |
| 停止 | `SessionEnd` |

hook設定ファイル: `~/.tvine/hooks/settings.json`
- プロジェクトの `.claude/` には一切触れない
- `--settings` フラグで追加読み込み

### 2. JSONL トランスクリプト（補完）

`~/.claude/projects/<project-hash>/<session-id>.jsonl` にセッションの全記録。
最後のエントリの種別から状態を推測する補完的な情報源。

### 通知経路

```
Claude Code → hook発火 → シェルコマンド → Unix socket → tvine(Rust) → Tauriイベント → フロントエンド
```

tvine(Rust)が起動時にUnix socketをlistenし、hookスクリプトがそこに直接データを送る。

## UI構成（MVPスコープ）

通常モードのみ。詳細モードはMVP後。

```
┌──────────┬──────────────────┬──────────┬──┐
│ Sessions │  Claude CLI      │ Changes  │⌨│
│          │  (xterm.js)      │┄┄┄┄┄┄┄┄┄│  │
│ ● feat…🟢│                  │ unified  │  │
│ ● fix… 🟡│                  │ diff     │  │
│ ● ref… ⚫│                  │          │  │
│          │                  │          │  │
│          │                  │          │  │
└──────────┴──────────────────┴──────────┴──┘
```

- 左: Sessions サイドバー（worktree一覧、ステータス、+ New、削除）
- 中央: xterm.js（Claude CLIをそのまま表示、フォーカスで入力可）
- 右: Changes パネル（git diff、トグル開閉）
- 右端: Terminal パネル（PTY、トグル開閉。閉じた状態で40pxアイコンバー、開くと360px）
- 入力バーなし（Claude CLIへの入力はターミナルに直接）

## 技術スタック

- **Tauri** (Rust + TypeScript)
- **React** + TypeScript（フロントエンド）
- **Mantine**（UIコンポーネント）
- **Zustand**（UI状態管理）
- **TanStack Query**（データ取得・キャッシュ）
- **xterm.js**（Claude CLI表示）
- **Tailwind CSS**（レイアウト・細かい調整）
- **Unix socket**（hooks通知受信）

## Worktree作成先

- デフォルト: プロジェクトと同階層（例: `my-app-worktrees/`）
- 設定で変更可能にする

## MVPスコープ

1. Tauriプロジェクト骨組み
2. Git worktree管理（一覧・作成・削除）
3. Claude CLIプロセス管理（PTY起動・resume）
4. Sessionsサイドバー
5. Changesパネル（unified diff）
6. Terminalパネル（PTY + xterm.js、トグル開閉）
7. ステータス管理（hooks + JSONL）
8. モーダル類（新規作成・削除確認・情報）

### MVPから除外

- 詳細モード（Chat/Diff/Fileタブ、Monaco Editor、サイドバイサイドdiff）
- Docker環境管理（Phase 3）
- IME対応（PTY方式ではClaude CLI側の問題）
