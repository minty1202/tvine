pub mod error;

use error::{Error as GitError, GitResult};
use git2::Repository;
use std::path::PathBuf;

pub struct ClientImpl {
    repo: Repository,
}

#[mockall::automock]
pub trait Client {
    // セマンティクス上は &Path が適切だが、mockall が参照の返却を扱いにくいため PathBuf にしている。
    fn project_root(&self) -> PathBuf;
}

impl ClientImpl {
    pub fn new() -> GitResult<Self> {
        let repo = Repository::discover(".").map_err(|_| GitError::NotARepository)?;

        Ok(Self { repo })
    }
}

impl Client for ClientImpl {
    fn project_root(&self) -> PathBuf {
        let repo = &self.repo;
        let work_dir_path = repo
            .workdir()
            .expect("discover 成功後のため workdir は常に Some を返す");
        work_dir_path.to_path_buf()
    }
}
