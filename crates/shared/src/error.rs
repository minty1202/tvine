use serde::Serialize;
use thiserror::Error;

#[derive(Serialize, Error, Debug)]
pub enum AppError {
    #[error("前提条件を満たしていません: {0}")]
    PrerequisiteNotMet(String),

    #[error("IO エラー: {0}")]
    IoError(String),

    #[error("Git エラー: {0}")]
    GitError(String),

    #[error("{0}")]
    NotFound(String),

    #[error("PTY エラー: {0}")]
    PtyError(String),

    #[error("予期せぬエラーが発生しました。")]
    InternalError,
}

pub type AppResult<T> = Result<T, AppError>;
