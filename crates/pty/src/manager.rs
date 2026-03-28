use crate::error::{PtyError, PtyResult};
use crate::process::PtyProcess;
use std::collections::HashMap;
use std::io::Read;
use std::path::Path;

pub struct PtyManager {
    processes: HashMap<String, PtyProcess>,
}

impl Default for PtyManager {
    fn default() -> Self {
        Self::new()
    }
}

impl PtyManager {
    pub fn new() -> Self {
        Self {
            processes: HashMap::new(),
        }
    }

    pub fn has(&self, session_id: &str) -> bool {
        self.processes.contains_key(session_id)
    }

    pub fn spawn(
        &mut self,
        session_id: &str,
        worktree_path: &Path,
        cols: u16,
        rows: u16,
    ) -> PtyResult<Box<dyn Read + Send>> {
        let (process, reader) = PtyProcess::spawn(session_id, worktree_path, cols, rows)?;
        self.processes.insert(session_id.to_string(), process);
        Ok(reader)
    }

    pub fn write(&mut self, session_id: &str, data: &[u8]) -> PtyResult<()> {
        let process = self
            .processes
            .get_mut(session_id)
            .ok_or_else(|| PtyError::NotFound(session_id.to_string()))?;
        process.write(data)
    }

    pub fn resize(&self, session_id: &str, cols: u16, rows: u16) -> PtyResult<()> {
        let process = self
            .processes
            .get(session_id)
            .ok_or_else(|| PtyError::NotFound(session_id.to_string()))?;
        process.resize(cols, rows)
    }

    pub fn kill(&mut self, session_id: &str) -> PtyResult<()> {
        if let Some(mut process) = self.processes.remove(session_id) {
            process.kill()?;
        }
        Ok(())
    }

    pub fn remove(&mut self, session_id: &str) {
        self.processes.remove(session_id);
    }
}
