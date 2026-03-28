use registry::app::AppRegistry;
use shared::error::AppResult;
use std::io::Read;
use std::path::Path;

pub fn has(registry: &dyn AppRegistry, session_id: &str) -> bool {
    let pty = registry.pty_repository();
    let manager = pty.lock().unwrap();
    manager.has(session_id)
}

pub fn spawn(
    registry: &dyn AppRegistry,
    session_id: &str,
    worktree_path: &Path,
    cols: u16,
    rows: u16,
    resume: bool,
) -> AppResult<Box<dyn Read + Send>> {
    let pty = registry.pty_repository();
    let mut manager = pty.lock().unwrap();
    manager.spawn(session_id, worktree_path, cols, rows, resume)
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
