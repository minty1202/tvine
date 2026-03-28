use shared::error::AppResult;
use std::io::Read;
use std::path::Path;

#[mockall::automock]
pub trait PtyRepository: Send {
    fn has(&self, session_id: &str) -> bool;
    fn spawn(
        &mut self,
        session_id: &str,
        worktree_path: &Path,
        cols: u16,
        rows: u16,
        resume: bool,
    ) -> AppResult<Box<dyn Read + Send>>;
    fn write(&mut self, session_id: &str, data: &[u8]) -> AppResult<()>;
    fn resize(&self, session_id: &str, cols: u16, rows: u16) -> AppResult<()>;
    fn kill(&mut self, session_id: &str) -> AppResult<()>;
    fn remove(&mut self, session_id: &str);
}
