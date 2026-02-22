use serde::Serialize;
use thiserror::Error;

#[derive(Serialize, Error, Debug)]
pub enum AppError {
    #[error("前提条件を満たしていません: {0}")]
    PrerequisiteNotMet(String),

    #[error("予期せぬエラーが発生しました。")]
    InternalError,
}

pub type AppResult<T> = Result<T, AppError>;
