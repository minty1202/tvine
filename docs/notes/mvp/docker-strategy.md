# tvine Docker 戦略

## 設計原則

- tvine はサポートツール。ワークフローを強制しない
- 使われる仕組みは標準的・よく知られたもの（docker-compose.override.yml、.env、COMPOSE_PROJECT_NAME、Docker ネットワーク）
- tvine がなくても成立する方法であること（魔法にしない）
- ユーザーが何が起きているか理解・予測できること

---

## スロットとは

スロット = worktree のライフサイクルに紐づく設定セット。

1. **worktree 作成時に特定のファイルを配置する**（テンプレート: .env、override 等）
2. **worktree 作成時に特定のコマンドを実行する**（初期化: db:migrate 等）
3. **worktree 削除時に特定のコマンドを実行する**（後処理: volume rm 等）

---

## スロット方式

worktree ごとにスロットを割り当て、ポートを固定管理する。

- スロットごとにポートが事前に決まっている（例: slot 1 = HTTP:8001, DB:3307）
- ユーザーが予測できる（「slot 1 は 8001」と覚えられる）
- tvine が裏でポートを自動判定するより魔法が少ない

---

## 並行開発で理解しておくべき Docker の仕組み

### COMPOSE_PROJECT_NAME

docker compose はプロジェクト名をもとに、コンテナ名・ネットワーク名・ボリューム名にプレフィックスを付ける。デフォルトはディレクトリ名。

```
ディレクトリ名: myapp
→ コンテナ: myapp-web-1, myapp-db-1
→ ネットワーク: myapp_default
→ ボリューム: myapp_db-data
```

並行開発では、同じ docker-compose.yml を複数ディレクトリで使うため、COMPOSE_PROJECT_NAME を明示的に変えないとコンテナ名やボリュームが衝突する。`.env` に書くだけで反映される。

```env
COMPOSE_PROJECT_NAME=myapp-slot1
```

これにより：
- **コンテナ名** → `myapp-slot1-web-1`（衝突しない）
- **ボリューム** → `myapp-slot1_db-data`（データが混ざらない）
- **ネットワーク** → `myapp-slot1_default`（通信が分離される）

### Docker ネットワーク

docker compose はプロジェクトごとにデフォルトネットワークを作る。同じプロジェクト内のコンテナはサービス名（`db`, `web` 等）で通信できる。

別プロジェクトのコンテナとは通信できない。共有したい場合は、明示的に共有ネットワークを作り、両方のプロジェクトから参加させる必要がある。

```yaml
# 共有ネットワークの定義
networks:
  shared_db:
    name: myapp_shared_db
    driver: bridge
```

これが共有 DB モードの基盤になる。

### ポートバインド

`ports: "8000:8000"` はホストの 8000 番ポートをコンテナに紐づける。同じホストポートを複数のコンテナで使えないため、並行開発ではポートをずらす必要がある。

```yaml
ports:
  - "${COMPOSE_PORT_HTTP:-8000}:8000"
```

環境変数にすれば、`.env` でスロットごとに変更できる。

### ボリューム

named volume はデータを永続化する。COMPOSE_PROJECT_NAME が違えばボリューム名も変わるので、自動的にデータが分離される。

- **共有 DB モード** → DB ボリュームは関係ない（busybox に差し替えるため）
- **独立 DB モード** → COMPOSE_PROJECT_NAME でボリュームが自動分離される

### まとめ

| 仕組み | 何を解決するか | 設定方法 |
|--------|---------------|---------|
| COMPOSE_PROJECT_NAME | コンテナ名・ボリューム・ネットワークの衝突 | `.env` |
| 共有ネットワーク | 別プロジェクトの DB への接続 | override |
| ポート変数化 | ホストポートの衝突 | `.env` + docker-compose.yml |

### 具体的に追加する内容

#### Main 環境（DB を提供する側）

**.env に追加:**
```env
# コンテナ名・ボリューム・ネットワークのプレフィックス
COMPOSE_PROJECT_NAME=myapp-main
# 共有ネットワークの名前（main とスロットで同じ値にする）
COMPOSE_SHARED_DB_NETWORK=myapp_shared_db
```

**override に追加:**
```yaml
networks:
  shared_db:
    # スロットからアクセスできる共有ネットワークを作成
    name: "${COMPOSE_SHARED_DB_NETWORK}"
    driver: bridge

services:
  db:
    networks:
      - default      # プロジェクト内の通常通信
      - shared_db    # スロットからのアクセスを受け入れる
```

→ これだけで DB が共有ネットワーク上でアクセス可能になる。既存の動作は変わらない。

#### スロット環境 — 共有 DB モード

**.env に追加:**
```env
# スロットごとに一意にする（コンテナ名・ボリュームの衝突回避）
COMPOSE_PROJECT_NAME=myapp-slot1
# ホストポートの衝突回避（スロットごとにずらす）
COMPOSE_PORT_HTTP=8001
# main と同じ値にする（接続先ネットワークの指定）
COMPOSE_SHARED_DB_NETWORK=myapp_shared_db
# tvine の設定ファイルも読み込む
COMPOSE_FILE=docker-compose.yml:docker-compose.override.yml:docker-compose.tvine.yml
```

**docker-compose.tvine.yml（スロットに追加が必要）:**
```yaml
networks:
  shared_db:
    # main が作成済みのネットワークに参加
    external: true
    name: "${COMPOSE_SHARED_DB_NETWORK}"
  dummy_network:

services:
  app:
    networks:
      - default      # プロジェクト内の通常通信
      - shared_db    # main の DB にアクセスするため

  db:
    # 本物の DB の代わりに何もしないコンテナ
    image: busybox:latest
    restart: "no"
    volumes: !reset []
    ports: !reset []
    networks: !override
      dummy_network:  # 隔離して他に影響させない
```

→ アプリは `db:3306` のまま接続。実際は main の DB に繋がる。

#### スロット環境 — 独立 DB モード

**.env に追加:**
```env
# スロットごとに一意にする（コンテナ名・ボリュームの衝突回避）
COMPOSE_PROJECT_NAME=myapp-slot1
# ホストポートの衝突回避（スロットごとにずらす）
COMPOSE_PORT_HTTP=8001
# DB ポートの衝突回避（ホストからアクセスする場合のみ必要）
DB_PORT=3307
# tvine の設定ファイルも読み込む
COMPOSE_FILE=docker-compose.yml:docker-compose.override.yml:docker-compose.tvine.yml
```

**docker-compose.tvine.yml（スロットに追加が必要）:**
```yaml
services:
  db:
    ports:
      # スロットごとのポートで公開（ホストからのアクセス用）
      - "${DB_PORT:-3306}:3306"
```

→ DB も含めて独立して起動。COMPOSE_PROJECT_NAME でボリュームが自動分離されるため、データも独立。

---

## 2つの DB モード

ユーザーは worktree 作成時にどちらかを選ぶだけ。tvine がスロットのポートと対応する override テンプレートを組み合わせて、override と .env を自動生成する。

### 共有 DB モード（通常の開発）

既に動いている Docker 環境の DB を共有する。openlogi 方式をベースにする。

**仕組み:**
- DB を busybox に差し替え（リソース消費ゼロ）
- 共有 Docker ネットワーク経由で既存の DB に接続
- アプリは `mysql:3306`（or `db:5432`）のまま接続先を変えなくていい

**override テンプレート（共有用）:**
```yaml
networks:
  shared_db:
    external: true
    name: "${COMPOSE_SHARED_DB_NETWORK}"
  dummy_network:

services:
  app:
    networks:
      - default
      - shared_db

  db:  # or mysql
    image: busybox:latest
    restart: "no"
    volumes: !reset []
    ports: !reset []
    networks: !override
      dummy_network:
```

**DB 側の override（DB を提供する環境に適用）:**
```yaml
networks:
  shared_db:
    name: "${COMPOSE_SHARED_DB_NETWORK}"
    driver: bridge

services:
  db:
    networks:
      - default
      - shared_db
```

**制約:**
- どこかで DB が動いている必要がある
- 破壊的なスキーマ変更は不可（独立モードに切り替える）

### 独立 DB モード（DB 変更を伴う開発）

worktree ごとに独立した DB を起動する。

**仕組み:**
- DB はそのまま起動
- COMPOSE_PROJECT_NAME でコンテナ・ボリュームを分離
- DB ポートはスロットの固定ポートを使用（ホストへの公開が不要なら省略可）

**override テンプレート（独立用）:**
```yaml
services:
  db:
    ports:
      - "${DB_PORT:-5432}:5432"
```

---

## .env の構成

各 worktree の .env は tvine がスロット情報から自動生成する。

**例（共有 DB モード、slot 1）:**
```env
COMPOSE_PROJECT_NAME=myproject-slot1
COMPOSE_PORT_HTTP=8001
COMPOSE_SHARED_DB_NETWORK=myproject_shared_db
```

**例（独立 DB モード、slot 1）:**
```env
COMPOSE_PROJECT_NAME=myproject-slot1
COMPOSE_PORT_HTTP=8001
DB_PORT=3307
```

---

## スロット定義の例

| Slot | HTTP | DB（独立時） |
|------|------|-------------|
| 0 | 8000 | 3306 / 5432 |
| 1 | 8001 | 3307 / 5433 |
| 2 | 8002 | 3308 / 5434 |
| 3 | 8003 | 3309 / 5435 |

Slot 0 は通常の開発環境（非 worktree）用。

---

## tvine がやること

1. worktree 作成時にスロットを割り当て
2. ユーザーが DB モード（共有 / 独立）を選択
3. スロットのポート + 選択されたモードのテンプレートから override と .env を生成
4. worktree ディレクトリに配置
5. worktree 削除時にスロットを解放、必要に応じて volume をクリーンアップ

## ユーザーがやること

1. worktree を作る（tvine UI から）
2. 「共有 DB」か「独立 DB」を選ぶ
3. `docker compose up`（または tvine が実行）
4. 開発する
5. 終わったら worktree を消す

---

## tvine の立ち位置

- override と .env を手動で書けば tvine なしでも同じことができる
- tvine はそれを楽にするだけ（テンプレートから生成、スロット管理）
- ユーザーが各環境を設定する必要があり、tvine がそれをサポートする
- スロットの数はユーザーが決める。tvine が勝手に上限を決めない

---

## 前提条件（ユーザーのプロジェクト側）

- `docker-compose.yml` のポートが環境変数化されていること（`${COMPOSE_PORT_HTTP:-8000}:8000`）
- `.env` が `.gitignore` に入っていること

※ これらは worktree 並行開発をする上で tvine がなくても必要になる標準的な設定。

---

## 必要な UI

1. **main 側のテンプレート設定** — DB を提供する環境の override / .env 設定
2. **worktree 側のテンプレート設定** — worktree に適用する override / .env 設定（ユーザーが自由にテンプレートを作成）
3. **スロット設定** — スロット数、ポート割り当て
4. **スロットへのテンプレート割り当て**
5. **override 再配置ボタン** — 削除・変更された override をテンプレートから再配置（自動ではなくユーザーの明示的操作）

### セッション一覧の視覚表現

セッションに紐づく情報を視覚的に区別する必要がある。
現時点で最低でもスロットとカテゴリ（テンプレートの種別）の2つがあるが、今後増える可能性がある。
それぞれ異なる手法で表現し、混同を避ける。

カテゴリの例（テンプレートの種別）：
- 共有 DB（既存の DB に接続）
- 独立 DB（自前の DB を起動）

表現手法の候補：
- 枠の色
- カードの形状（角丸の度合い、サイズ）
- バッジ（テキスト付きの小さなタグ）
- リボン（カード角のリボン装飾）
- 左端のストライプ（カード左辺に縦線を入れる）
- アイコン（カテゴリごとに異なるアイコン）
- 背景パターン（薄い斜線やドット）

最低限の実装：
- **枠の色** — スロットの識別
- **タグ** — カテゴリの識別（N 個、ユーザーが自由に追加可能）

その他の表現手法は必要に応じて UI 実装時に検討する。

---

## 初期化コマンド

独立 DB モードだけは、スロット作成時に DB の初期化が毎回必要になる。
共有 DB モードや gem / node_modules は volume が残るため初期化不要。

スロット設定に初期化コマンドを登録できるようにする。

**例:**
```
rails db:create db:migrate db:seed
```

独立 DB モードのライフサイクル:
1. 作成時 → volume 作成 → 初期化コマンド実行
2. 開発 → ブランチのマイグレーション適用等
3. 削除時 → volume を remove（クリーンアップ）

gem install や docker build はブランチ間で Gemfile / Dockerfile が変わったときだけ必要。
これは通常の開発と同じで、tvine が特別サポートする必要はない。

---

## テンプレート管理

worktree には gitignore されたファイルが持ち込めない。これを解決するために、tvine は「worktree に配置するファイルのテンプレート管理」を汎用的に提供する。Docker の `.env` や override はその一部に過ぎない。

対象ファイルの例：
- `.env`
- `docker-compose.tvine.yml`（override）
- `.tool-versions`
- `.envrc`
- その他プロジェクト固有の gitignore されたファイル

### MVP

- tvine の UI 上でテンプレートを編集・管理する
- worktree 作成時にテンプレートからファイルを配置

### 将来

- コピーエディタ：プロジェクト内のファイルを選んで cp ボタンを押すとテンプレートに取り込まれる。取り込み後はテンプレート側で自由に編集

---

## tvine が提供する機能

### 課題

worktree で並行開発する際、2つの問題がある：
1. gitignore されたファイルが worktree に持ち込めない
2. 持ち込めたとしても main とは設定を変える必要がある（ポート、COMPOSE_PROJECT_NAME 等）

tvine はこの課題を解決する手段を提供する。具体的にどのファイルをどう変えるかはユーザーが決める。tvine 側から特定の方式を押し付けない。

### 機能

1. **スロット管理** — worktree に割り当てる環境枠の管理（ポート定義等）
2. **テンプレート管理** — worktree に配置するファイルの編集・保持（.env、override、その他 gitignore されたファイル）
3. **ファイル配置** — worktree 作成時にスロットのテンプレートからファイルを配置
4. **再配置** — 削除・変更されたファイルをテンプレートから再配置（ユーザーの明示的操作）
5. **初期化コマンド** — worktree 作成時に実行するコマンドをスロットに登録できる（例: `rails db:create db:migrate db:seed`）
6. **削除時コマンド** — worktree 削除時に実行するコマンドをスロットに登録できる（例: `docker volume rm`、`docker compose down` 等）
7. **スロット解放** — worktree 削除時にスロットを解放

### 個人の使い方想定（aki）

普段は共有 DB モードで開発する。main 側の override は自分で書く（共有ネットワーク公開）。

**スロットのテンプレートに入れるもの：**
- `.env` — COMPOSE_PROJECT_NAME、ポート、COMPOSE_SHARED_DB_NETWORK、COMPOSE_FILE
- `docker-compose.override.yml` — DB を busybox に差し替え、共有ネットワーク参加（自分の既存 override 設定も含む）

**フロー：**
1. tvine でスロットとテンプレートを事前に設定しておく
2. worktree を作る → スロットが割り当てられ、テンプレートからファイルが配置される
3. `docker compose up` → DB 以外が起動、DB は main に繋がる
4. Claude Code で開発
5. 終わったら worktree を消す → スロット解放

**DB 変更を伴う開発の場合：**
- 独立 DB 用のテンプレートを別途用意しておく
- worktree 作成時にそちらを選択
- 初期化コマンド（`rails db:create db:migrate db:seed`）を実行
- 削除時に volume も remove

---

## 未解決・後回し

- 既存の override との共存（ユーザーが既に override を使っている場合のマージ戦略）
- 既存の .env との共存
- DB 以外のステートフルサービス（Redis、Elasticsearch 等）の扱い
- スロット数の上限設定（リソースに応じて変更可能にする）
- Volume スナップショット（独立 DB で既存データをコピーしたい場合）

---

## 参考

- [openlogi — Git Worktree + Docker Compose](https://zenn.dev/openlogi/articles/26e98790dcaca4): 共有 DB モードのベース。busybox 差し替え + 共有ネットワーク
- [LayerX — Git Worktree と Docker Volume](https://zenn.dev/layerx/articles/6539bf1842f1e0): 独立 DB モードの参考。Volume スナップショット + override
- [SocialDog — Docker Compose 複数環境](https://zenn.dev/socialdog/articles/multiple-docker-compose-up): COMPOSE_PROJECT_NAME + プロキシ方式
