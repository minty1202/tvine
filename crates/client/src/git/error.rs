use serde::Serialize;
use thiserror::Error;

#[derive(Serialize, Error, Debug)]
pub enum Error {
    #[error("Git リポジトリが見つかりませんでした")]
    NotARepository,
}

pub type GitResult<T> = Result<T, Error>;
