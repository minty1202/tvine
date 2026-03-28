use std::sync::{Arc, Mutex};

use adapter::repository::{
    git::GitRepositoryImpl, health::HealthCheckRepositoryImpl, pty::PtyRepositoryImpl,
    session::SessionRepositoryImpl,
};
use client::git::Client as GitClient;
use data::ProjectContext;
use kernel::repository::{
    git::GitRepository, health::HealthCheckRepository, pty::PtyRepository,
    session::SessionRepository,
};

#[derive(Clone)]
pub struct AppRegistryImpl {
    health_check_repository: Arc<dyn HealthCheckRepository>,
    git_repository: Arc<dyn GitRepository>,
    session_repository: Arc<dyn SessionRepository>,
    pty_repository: Arc<Mutex<dyn PtyRepository>>,
    project_context: ProjectContext,
}

#[allow(clippy::new_without_default)]
impl AppRegistryImpl {
    pub fn new(
        git_client: Box<dyn GitClient + Send + Sync>,
        project_context: ProjectContext,
    ) -> Self {
        let health_check_repository = Arc::new(HealthCheckRepositoryImpl::new());
        let git_repository = Arc::new(GitRepositoryImpl::new(git_client));
        let session_repository = Arc::new(SessionRepositoryImpl::new(project_context.clone()));
        let pty_repository: Arc<Mutex<dyn PtyRepository>> =
            Arc::new(Mutex::new(PtyRepositoryImpl::new()));

        Self {
            health_check_repository,
            git_repository,
            session_repository,
            pty_repository,
            project_context,
        }
    }
}

#[mockall::automock]
pub trait AppRegistry {
    fn health_check_repository(&self) -> Arc<dyn HealthCheckRepository>;
    fn git_repository(&self) -> Arc<dyn GitRepository>;
    fn session_repository(&self) -> Arc<dyn SessionRepository>;
    fn pty_repository(&self) -> Arc<Mutex<dyn PtyRepository>>;
    fn project_context(&self) -> &ProjectContext;
}

impl AppRegistry for AppRegistryImpl {
    fn health_check_repository(&self) -> Arc<dyn HealthCheckRepository> {
        self.health_check_repository.clone()
    }

    fn git_repository(&self) -> Arc<dyn GitRepository> {
        self.git_repository.clone()
    }

    fn session_repository(&self) -> Arc<dyn SessionRepository> {
        self.session_repository.clone()
    }

    fn pty_repository(&self) -> Arc<Mutex<dyn PtyRepository>> {
        self.pty_repository.clone()
    }

    fn project_context(&self) -> &ProjectContext {
        &self.project_context
    }
}

pub type AppRegistryState = Arc<dyn AppRegistry + Send + Sync + 'static>;
