use kernel::repository::pty::PtyRepository;
use pty::PtyManager;
use shared::error::{AppError, AppResult};
use std::io::Read;
use std::path::Path;

pub struct PtyRepositoryImpl {
    manager: PtyManager,
}

impl PtyRepositoryImpl {
    pub fn new() -> Self {
        Self {
            manager: PtyManager::new(),
        }
    }
}

impl PtyRepository for PtyRepositoryImpl {
    fn has(&self, session_id: &str) -> bool {
        self.manager.has(session_id)
    }

    fn spawn(
        &mut self,
        session_id: &str,
        worktree_path: &Path,
        cols: u16,
        rows: u16,
        resume: bool,
    ) -> AppResult<Box<dyn Read + Send>> {
        self.manager
            .spawn(session_id, worktree_path, cols, rows, resume)
            .map_err(|e| AppError::PtyError(e.to_string()))
    }

    fn write(&mut self, session_id: &str, data: &[u8]) -> AppResult<()> {
        self.manager
            .write(session_id, data)
            .map_err(|e| AppError::PtyError(e.to_string()))
    }

    fn resize(&self, session_id: &str, cols: u16, rows: u16) -> AppResult<()> {
        self.manager
            .resize(session_id, cols, rows)
            .map_err(|e| AppError::PtyError(e.to_string()))
    }

    fn kill(&mut self, session_id: &str) -> AppResult<()> {
        self.manager
            .kill(session_id)
            .map_err(|e| AppError::PtyError(e.to_string()))
    }

    fn remove(&mut self, session_id: &str) {
        self.manager.remove(session_id)
    }
}
