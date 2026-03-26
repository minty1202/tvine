# Tauri 起動時に init を実行する

Issue: #14

## チェックリスト

- [x] [Tauri の setup フックで init を実行する](#tauri-の-setup-フックで-init-を実行する)

## 方針

### Tauri の setup フックで init を実行する

Tauri の `setup` フックで、CLI と同じ init シーケンスを呼ぶ。

1. `AppContext` を作成
2. `BootstrapRegistryImpl::new(context)` で registry 作成
3. `prerequisite_check(&registry)` — git / claude の存在確認
4. `initialize(&registry)` — `~/.tvine/` 作成
5. `initialize_project(&registry)` — プロジェクトディレクトリ作成

エラー時はフロントエンドにエラー画面を出さず、`panic` で落とす。init は UI 表示前のフェーズなので、画面を出す段階ではない。

### scope 外

- `AppRegistry` を Tauri の `manage()` で state として保持する設計は、invoke コマンドを実装するタイミングで検討する
