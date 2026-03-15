use client::git::Client as GitClient;
use derive_new::new;
use kernel::repository::git::GitRepository;
use std::path::PathBuf;

#[derive(new)]
pub struct GitRepositoryImpl {
    git: Box<dyn GitClient + Send + Sync>,
}

impl GitRepository for GitRepositoryImpl {
    fn project_root(&self) -> PathBuf {
        self.git.project_root()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use client::git::MockClient;

    #[test]
    fn project_root_delegates_to_git_client() {
        let mut mock = MockClient::new();
        mock.expect_project_root()
            .returning(|| PathBuf::from("/home/user/dev/myapp"));

        let repo = GitRepositoryImpl::new(Box::new(mock));
        let result = repo.project_root();

        assert_eq!(result, PathBuf::from("/home/user/dev/myapp"));
    }
}
