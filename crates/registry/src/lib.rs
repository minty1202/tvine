use std::sync::Arc;

use adapter::repository::health::HealthCheckRepositoryImpl;
use kernel::repository::health::HealthCheckRepository;

#[derive(Clone)]
pub struct AppRegistryImpl {
    health_check_repository: Arc<dyn HealthCheckRepository>,
}

impl AppRegistryImpl {
    pub fn new() -> Self {
        let health_check_repository = Arc::new(HealthCheckRepositoryImpl::new());

        Self {
            health_check_repository,
        }
    }
}

#[mockall::automock]
pub trait AppRegistry {
    fn health_check_repository(&self) -> Arc<dyn HealthCheckRepository>;
}

impl AppRegistry for AppRegistryImpl {
    fn health_check_repository(&self) -> Arc<dyn HealthCheckRepository> {
        self.health_check_repository.clone()
    }
}

pub type AppRegistryState = Arc<dyn AppRegistry + Send + Sync + 'static>;
