use async_trait::async_trait;

#[mockall::automock]
#[async_trait]
pub trait HealthCheckRepository {
    async fn check_dir(&self) -> bool;
}
