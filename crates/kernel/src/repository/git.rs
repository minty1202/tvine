use std::path::PathBuf;

#[mockall::automock]
pub trait GitRepository {
    fn project_root(&self) -> PathBuf;
}
