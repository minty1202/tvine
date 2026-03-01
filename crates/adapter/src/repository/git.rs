use std::path::PathBuf; 
use derive_new::new;
use client::git::Client as GitClient;
use kernel::repository::git::GitRepository;

#[derive(new)]
pub struct GitRepositoryImpl {
    git: Box<dyn GitClient>
}

impl GitRepository for GitRepositoryImpl {
    fn project_root(&self) -> PathBuf {
        self.git.project_root()
    }
}
