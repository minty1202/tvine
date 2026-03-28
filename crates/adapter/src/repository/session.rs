use data::manage::session::{delete_session, list_sessions, save_session};
use data::ProjectContext;
use kernel::model::session::{Session, SessionId};
use kernel::repository::session::SessionRepository;
use shared::error::{AppError, AppResult};

pub struct SessionRepositoryImpl {
    project_context: ProjectContext,
}

impl SessionRepositoryImpl {
    pub fn new(project_context: ProjectContext) -> Self {
        Self { project_context }
    }
}

impl SessionRepository for SessionRepositoryImpl {
    fn create(&self, session: &Session) -> AppResult<()> {
        save_session(&self.project_context, session).map_err(|e| AppError::IoError(e.to_string()))
    }

    fn list(&self) -> AppResult<Vec<Session>> {
        list_sessions(&self.project_context).map_err(|e| AppError::IoError(e.to_string()))
    }

    fn delete(&self, id: &SessionId) -> AppResult<()> {
        delete_session(&self.project_context, id.as_str())
            .map_err(|e| AppError::IoError(e.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use data::{AppContext, ProjectId};
    use kernel::model::session::SessionId;
    use std::path::PathBuf;
    use std::sync::Arc;

    fn setup() -> PathBuf {
        shared::utility::test_dir().unwrap()
    }

    fn cleanup(test_dir: &std::path::Path) {
        let _ = std::fs::remove_dir_all(test_dir);
    }

    #[test]
    fn create_delegates_to_save_session() {
        let test_dir = setup().join("session_repo");
        std::fs::create_dir_all(&test_dir).unwrap();
        let app = Arc::new(AppContext::new(test_dir.clone()));
        let repo_root = PathBuf::from("/Users/aki/dev/test");
        let id = ProjectId::from(repo_root.as_path());
        let ctx = ProjectContext::new(app, id, repo_root);

        let repo = SessionRepositoryImpl::new(ctx.clone());
        let session = Session {
            id: SessionId::new("adapter-test-uuid".to_string()),
            branch_name: "feature/test".to_string(),
            base_branch: "main".to_string(),
            worktree_path: PathBuf::from("/Users/aki/dev/test-feature-test"),
            created_at: "2026-03-28T12:00:00Z".to_string(),
        };

        let result = repo.create(&session);
        assert!(result.is_ok());
        assert!(ctx
            .storage_dir()
            .join("sessions")
            .join("adapter-test-uuid")
            .join("session.json")
            .exists());

        cleanup(&test_dir);
    }
}
