use std::path::PathBuf;

/// Git リポジトリの情報を取得する。
/// プロジェクトルートの取得など、git リポジトリに関する問い合わせを担う。
#[mockall::automock]
pub trait GitRepository {
    fn project_root(&self) -> PathBuf;
    fn default_branch(&self) -> String;
}
