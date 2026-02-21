use registry::AppRegistryExt;

pub async fn health_check(registry: &dyn AppRegistryExt) -> String {
    if registry.health_check_repository().check_dir().await {
        String::from("true")
    } else {
        String::from("false")
    }
}
