pub mod error;

use error::{Error as GitError, GitResult};
use git2::Repository;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

pub struct ClientImpl {
    repo: Mutex<Repository>,
}

#[mockall::automock]
pub trait Client {
    // セマンティクス上は &Path が適切だが、mockall が参照の返却を扱いにくいため PathBuf にしている。
    fn project_root(&self) -> PathBuf;
    fn default_branch(&self) -> String;
    fn create_worktree(&self, base_branch: &str, branch_name: &str, path: &Path) -> GitResult<()>;
    fn force_remove_worktree(&self, path: &Path) -> GitResult<()>;
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
        // git2 の workdir() は末尾スラッシュ付きパスを返すことがあるため正規化する
        work_dir_path.components().collect()
    }

    fn default_branch(&self) -> String {
        std::process::Command::new("git")
            .args(["symbolic-ref", "--short", "refs/remotes/origin/HEAD"])
            .output()
            .ok()
            .filter(|o| o.status.success())
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .map(|s| {
                s.trim()
                    .strip_prefix("origin/")
                    .unwrap_or(s.trim())
                    .to_string()
            })
            .unwrap_or_else(|| "main".to_string())
    }

    fn create_worktree(&self, base_branch: &str, branch_name: &str, path: &Path) -> GitResult<()> {
        let output = std::process::Command::new("git")
            .args([
                "worktree",
                "add",
                "-b",
                branch_name,
                &path.to_string_lossy(),
                base_branch,
            ])
            .output()
            .map_err(|e| GitError::CommandFailed(e.to_string()))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            return Err(GitError::CommandFailed(stderr));
        }

        Ok(())
    }

    fn force_remove_worktree(&self, path: &Path) -> GitResult<()> {
        let output = std::process::Command::new("git")
            .args(["worktree", "remove", "--force", &path.to_string_lossy()])
            .output()
            .map_err(|e| GitError::CommandFailed(e.to_string()))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            return Err(GitError::CommandFailed(stderr));
        }

        Ok(())
    }
}
