use std::sync::Arc;

use adapter::repository::{git::GitRepositoryImpl, health::HealthCheckRepositoryImpl};
use client::git::Client as GitClient;
use kernel::repository::{git::GitRepository, health::HealthCheckRepository};

#[derive(Clone)]
pub struct AppRegistryImpl {
    health_check_repository: Arc<dyn HealthCheckRepository>,
    git_repository: Arc<dyn GitRepository>,
}

#[allow(clippy::new_without_default)]
impl AppRegistryImpl {
    pub fn new(git_client: Box<dyn GitClient + Send + Sync>) -> Self {
        let health_check_repository = Arc::new(HealthCheckRepositoryImpl::new());
        let git_repository = Arc::new(GitRepositoryImpl::new(git_client));

        Self {
            health_check_repository,
            git_repository,
        }
    }
}

#[mockall::automock]
pub trait AppRegistry {
    fn health_check_repository(&self) -> Arc<dyn HealthCheckRepository>;
    fn git_repository(&self) -> Arc<dyn GitRepository>;
}

impl AppRegistry for AppRegistryImpl {
    fn health_check_repository(&self) -> Arc<dyn HealthCheckRepository> {
        self.health_check_repository.clone()
    }

    fn git_repository(&self) -> Arc<dyn GitRepository> {
        self.git_repository.clone()
    }
}

pub type AppRegistryState = Arc<dyn AppRegistry + Send + Sync + 'static>;
