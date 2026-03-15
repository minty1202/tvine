use std::path::{Path, PathBuf};
use std::sync::Arc;

pub mod manage;
mod project_id;

pub use project_id::ProjectId;

const APP_DIR_NAME: &str = ".tvine";
const PROJECTS_DIR_NAME: &str = "projects";
const SESSIONS_DIR_NAME: &str = "sessions";
const PROJECT_CONFIG_FILE: &str = "project.json";

#[derive(Debug)]
pub struct AppContext {
    base_path: PathBuf,
}

impl AppContext {
    pub fn new(home_dir: PathBuf) -> Self {
        let base_path = home_dir.join(APP_DIR_NAME);
        Self { base_path }
    }

    pub fn base_path(&self) -> &Path {
        &self.base_path
    }
}

#[derive(Debug, Clone)]
pub struct ProjectContext {
    app_context: Arc<AppContext>,
    project_id: ProjectId,
    repository_root: PathBuf,
}

impl ProjectContext {
    pub fn new(
        app_context: Arc<AppContext>,
        project_id: ProjectId,
        repository_root: PathBuf,
    ) -> Self {
        Self {
            app_context,
            project_id,
            repository_root,
        }
    }

    pub fn storage_dir(&self) -> PathBuf {
        self.app_context
            .base_path()
            .join(PROJECTS_DIR_NAME)
            .join(self.project_id.as_str())
    }

    pub fn project_id(&self) -> &ProjectId {
        &self.project_id
    }

    pub fn repository_root(&self) -> &Path {
        &self.repository_root
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn app_context_base_path_appends_tvine() {
        let ctx = AppContext::new(PathBuf::from("/home/user"));
        assert_eq!(ctx.base_path(), Path::new("/home/user/.tvine"));
    }

    #[test]
    fn project_context_storage_dir() {
        let app = Arc::new(AppContext::new(PathBuf::from("/home/user")));
        let repo_root = PathBuf::from("/Users/aki/dev");
        let id = ProjectId::from(repo_root.as_path());
        let ctx = ProjectContext::new(app, id, repo_root);
        assert_eq!(
            ctx.storage_dir(),
            PathBuf::from("/home/user/.tvine/projects/Users-aki-dev")
        );
    }

    #[test]
    fn project_context_accessors() {
        let app = Arc::new(AppContext::new(PathBuf::from("/tmp")));
        let repo_root = PathBuf::from("/Users/aki/my-project");
        let id = ProjectId::from(repo_root.as_path());
        let ctx = ProjectContext::new(app, id, repo_root.clone());
        assert_eq!(
            ctx.project_id(),
            &ProjectId::from(Path::new("/Users/aki/my-project"))
        );
        assert_eq!(ctx.repository_root(), repo_root);
    }
}
