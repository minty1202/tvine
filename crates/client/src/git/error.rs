use serde::Serialize;
use thiserror::Error;

#[derive(Serialize, Error, Debug)]
pub enum Error {
    #[error("Git リポジトリが見つかりませんでした")]
    NotARepository,

    #[error("Git コマンドが失敗しました: {0}")]
    CommandFailed(String),
}

pub type GitResult<T> = Result<T, Error>;
