use std::io::Read;
use std::path::Path;

#[mockall::automock]
pub trait PtyRepository: Send + Sync {
    fn has(&self, session_id: &str) -> bool;
    fn spawn(
        &mut self,
        session_id: &str,
        worktree_path: &Path,
        cols: u16,
        rows: u16,
        resume: bool,
    ) -> Result<Box<dyn Read + Send>, String>;
    fn write(&mut self, session_id: &str, data: &[u8]) -> Result<(), String>;
    fn resize(&self, session_id: &str, cols: u16, rows: u16) -> Result<(), String>;
    fn kill(&mut self, session_id: &str) -> Result<(), String>;
    fn remove(&mut self, session_id: &str);
}
