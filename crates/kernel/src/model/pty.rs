use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(ts_rs::TS))]
#[cfg_attr(test, ts(export))]
pub struct SpawnPtyParams {
    pub session_id: String,
    pub worktree_path: String,
    pub cols: u16,
    pub rows: u16,
    pub resume: bool,
}
