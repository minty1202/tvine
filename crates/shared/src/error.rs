use serde::Serialize;
use thiserror::Error;

#[derive(Serialize, Error, Debug)]
pub enum AppError {
    #[error("予期せぬエラーが発生しました。")]
    InternalError,
}

pub type AppResult<T> = Result<T, AppError>;
