/// プロジェクトの初期化を担う。
/// ルートディレクトリの作成、プロジェクトルートの取得、プロジェクトディレクトリの構築など、
/// アプリ起動時に必要なセットアップ処理を定義する。
#[mockall::automock]
pub trait Initializer {
    fn ensure_root_dir(&self) -> std::io::Result<()>;
}
