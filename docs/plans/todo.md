# TODO

まだ Issue にしていないが、議論の過程で生まれた対応が必要なことを置く場所。

## 未着手

- health check で `check_dir` が false の時の挙動を決める。ディレクトリがなければ作成して `Ok` にするのか、`Err` で返すのか、`Ok(false)` として呼び出し側に判断を委ねるのか。例: `Ok(false)` → CLI やアプリ起動時にディレクトリを自動作成する

## Issue 化済み

- ~~health check で `~/.tvine/` ディレクトリの存在確認をする~~ → #9
- ~~エラー型の設計を決める（thiserror で AppError を shared に定義、AppResult 型エイリアス等）~~ → #8
