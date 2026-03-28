pub mod error;

use error::{Error as GitError, GitResult};
use git2::Repository;
use std::path::PathBuf;
use std::sync::Mutex;

pub struct ClientImpl {
    repo: Mutex<Repository>,
}

#[mockall::automock]
pub trait Client {
    // セマンティクス上は &Path が適切だが、mockall が参照の返却を扱いにくいため PathBuf にしている。
    fn project_root(&self) -> PathBuf;
    fn default_branch(&self) -> String;
}

impl ClientImpl {
    pub fn new() -> GitResult<Self> {
        let repo = Repository::discover(".").map_err(|_| GitError::NotARepository)?;

        Ok(Self {
            repo: Mutex::new(repo),
        })
    }
}

impl Client for ClientImpl {
    fn project_root(&self) -> PathBuf {
        let repo = self
            .repo
            .lock()
            .expect("mutex が poisoned されていないこと");
        let work_dir_path = repo
            .workdir()
            .expect("discover 成功後のため workdir は常に Some を返す");
        work_dir_path.to_path_buf()
    }

    fn default_branch(&self) -> String {
        std::process::Command::new("git")
            .args(["symbolic-ref", "--short", "refs/remotes/origin/HEAD"])
            .output()
            .ok()
            .filter(|o| o.status.success())
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .map(|s| s.trim().strip_prefix("origin/").unwrap_or(s.trim()).to_string())
            .unwrap_or_else(|| "main".to_string())
    }
}
