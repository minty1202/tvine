use registry::AppRegistry;
use shared::error::{AppError, AppResult};

pub async fn health_check(registry: &dyn AppRegistry) -> AppResult<bool> {
    if registry.health_check_repository().check_dir().await {
        Ok(true)
    } else {
        Err(AppError::InternalError)
    }
}
