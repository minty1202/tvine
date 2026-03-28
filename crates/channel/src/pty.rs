use registry::app::AppRegistry;
use shared::error::{AppError, AppResult};
use std::io::Read;

pub fn has(registry: &dyn AppRegistry, session_id: &str) -> bool {
    let pty = registry.pty_repository();
    let manager = pty.lock().unwrap();
    manager.has(session_id)
}

pub fn spawn(
    registry: &dyn AppRegistry,
    session_id: &str,
    cols: u16,
    rows: u16,
) -> AppResult<Box<dyn Read + Send>> {
    let session = registry
        .session_repository()
        .get(&kernel::model::session::SessionId::new(
            session_id.to_string(),
        ))?
        .ok_or_else(|| AppError::NotFound(format!("Session not found: {session_id}")))?;

    // TODO: claude_launched フラグによる resume 判断は後続で実装
    let resume = false;

    let pty = registry.pty_repository();
    let mut manager = pty.lock().unwrap();
    manager.spawn(session_id, &session.worktree_path, cols, rows, resume)
}

pub fn write(registry: &dyn AppRegistry, session_id: &str, data: &[u8]) -> AppResult<()> {
    let pty = registry.pty_repository();
    let mut manager = pty.lock().unwrap();
    manager.write(session_id, data)
}

pub fn resize(registry: &dyn AppRegistry, session_id: &str, cols: u16, rows: u16) -> AppResult<()> {
    let pty = registry.pty_repository();
    let manager = pty.lock().unwrap();
    manager.resize(session_id, cols, rows)
}

pub fn kill(registry: &dyn AppRegistry, session_id: &str) -> AppResult<()> {
    let pty = registry.pty_repository();
    let mut manager = pty.lock().unwrap();
    manager.kill(session_id)
}

pub fn remove(registry: &dyn AppRegistry, session_id: &str) {
    let pty = registry.pty_repository();
    let mut manager = pty.lock().unwrap();
    manager.remove(session_id)
}
