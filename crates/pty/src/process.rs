use crate::error::{PtyError, PtyResult};
use portable_pty::{native_pty_system, Child, CommandBuilder, MasterPty, PtySize};
use std::io::{Read, Write};
use std::path::Path;

pub struct PtyProcess {
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
    child: Box<dyn Child + Send + Sync>,
}

impl PtyProcess {
    pub fn spawn(
        session_id: &str,
        worktree_path: &Path,
        cols: u16,
        rows: u16,
        resume: bool,
    ) -> PtyResult<(Self, Box<dyn Read + Send>)> {
        let pty_system = native_pty_system();
        let pair = pty_system
            .openpty(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| PtyError::SpawnFailed(e.to_string()))?;

        let mut cmd = CommandBuilder::new("claude");
        if resume {
            cmd.args(["--resume", session_id]);
        } else {
            cmd.args(["--session-id", session_id]);
        }
        cmd.cwd(worktree_path);

        let child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| PtyError::SpawnFailed(e.to_string()))?;
        drop(pair.slave);

        let reader = pair
            .master
            .try_clone_reader()
            .map_err(|e| PtyError::SpawnFailed(e.to_string()))?;
        let writer = pair
            .master
            .take_writer()
            .map_err(|e| PtyError::SpawnFailed(e.to_string()))?;

        let process = Self {
            master: pair.master,
            writer,
            child,
        };

        Ok((process, reader))
    }

    pub fn write(&mut self, data: &[u8]) -> PtyResult<()> {
        self.writer
            .write_all(data)
            .map_err(|e| PtyError::WriteFailed(e.to_string()))?;
        self.writer
            .flush()
            .map_err(|e| PtyError::WriteFailed(e.to_string()))?;
        Ok(())
    }

    pub fn resize(&self, cols: u16, rows: u16) -> PtyResult<()> {
        self.master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| PtyError::ResizeFailed(e.to_string()))?;
        Ok(())
    }

    pub fn kill(&mut self) -> PtyResult<()> {
        self.child
            .kill()
            .map_err(|e| PtyError::KillFailed(e.to_string()))?;
        self.child
            .wait()
            .map_err(|e| PtyError::KillFailed(e.to_string()))?;
        Ok(())
    }
}
