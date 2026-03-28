use crate::{ProjectContext, PROJECT_CONFIG_FILE, SESSIONS_DIR_NAME};
use serde::Serialize;
use std::io;

#[derive(Serialize)]
struct ProjectConfig {
    root: String,
    default_branch: String,
}

pub fn ensure_project_dir(ctx: &ProjectContext, default_branch: &str) -> io::Result<()> {
    let storage_dir = ctx.storage_dir();

    let config_path = storage_dir.join(PROJECT_CONFIG_FILE);
    if config_path.exists() {
        return Ok(());
    }

    std::fs::create_dir_all(&storage_dir)?;
    std::fs::create_dir_all(storage_dir.join(SESSIONS_DIR_NAME))?;

    let config = ProjectConfig {
        root: ctx.repository_root().to_string_lossy().into_owned(),
        default_branch: default_branch.to_string(),
    };
    let json = serde_json::to_string_pretty(&config).map_err(io::Error::other)?;
    std::fs::write(config_path, json)?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{AppContext, ProjectId};
    use std::path::PathBuf;
    use std::sync::Arc;

    fn setup() -> PathBuf {
        shared::utility::test_dir().unwrap()
    }

    fn cleanup(test_dir: &std::path::Path) {
        let _ = std::fs::remove_dir_all(test_dir);
    }

    #[test]
    fn ensure_project_dir_creates_structure() {
        let test_dir = setup().join("creates_structure");
        std::fs::create_dir_all(&test_dir).unwrap();
        let app = Arc::new(AppContext::new(test_dir.clone()));
        let repo_root = PathBuf::from("/Users/aki/dev/test");
        let id = ProjectId::from(repo_root.as_path());
        let ctx = ProjectContext::new(app, id, repo_root);

        let result = ensure_project_dir(&ctx, "main");
        assert!(result.is_ok());

        let storage_dir = ctx.storage_dir();
        assert!(storage_dir.exists());
        assert!(storage_dir.join(SESSIONS_DIR_NAME).exists());

        let config: serde_json::Value = serde_json::from_str(
            &std::fs::read_to_string(storage_dir.join(PROJECT_CONFIG_FILE)).unwrap(),
        )
        .unwrap();
        assert_eq!(config["root"], "/Users/aki/dev/test");
        assert_eq!(config["default_branch"], "main");

        cleanup(&test_dir);
    }

    #[test]
    fn ensure_project_dir_is_idempotent() {
        let test_dir = setup().join("idempotent");
        std::fs::create_dir_all(&test_dir).unwrap();
        let app = Arc::new(AppContext::new(test_dir.clone()));
        let repo_root = PathBuf::from("/Users/aki/dev/test");
        let id = ProjectId::from(repo_root.as_path());
        let ctx = ProjectContext::new(app, id, repo_root);

        ensure_project_dir(&ctx, "main").unwrap();
        let result = ensure_project_dir(&ctx, "main");
        assert!(result.is_ok());

        cleanup(&test_dir);
    }
}
