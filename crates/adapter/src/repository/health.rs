use async_trait::async_trait;
use derive_new::new;
use kernel::repository::health::HealthCheckRepository;

#[derive(new)]
pub struct HealthCheckRepositoryImpl {}

#[async_trait]
impl HealthCheckRepository for HealthCheckRepositoryImpl {
    async fn check_dir(&self) -> bool {
        true
    }
}
