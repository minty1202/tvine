use std::fmt;

#[derive(Debug)]
pub enum PtyError {
    SpawnFailed(String),
    WriteFailed(String),
    ResizeFailed(String),
    KillFailed(String),
    NotFound(String),
}

impl fmt::Display for PtyError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PtyError::SpawnFailed(msg) => write!(f, "PTY の起動に失敗しました: {msg}"),
            PtyError::WriteFailed(msg) => write!(f, "PTY への書き込みに失敗しました: {msg}"),
            PtyError::ResizeFailed(msg) => write!(f, "PTY のリサイズに失敗しました: {msg}"),
            PtyError::KillFailed(msg) => write!(f, "PTY の終了に失敗しました: {msg}"),
            PtyError::NotFound(id) => write!(f, "PTY が見つかりません: {id}"),
        }
    }
}

impl std::error::Error for PtyError {}

pub type PtyResult<T> = Result<T, PtyError>;
