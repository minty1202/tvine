use data::manage::project::ensure_project_dir;
use data::ProjectContext;
use registry::{AppRegistry, BootstrapRegistry};
use shared::error::{AppError, AppResult};

pub fn prerequisite_check(registry: &dyn BootstrapRegistry) -> AppResult<()> {
    if registry.prerequisite().check() {
        Ok(())
    } else {
        Err(AppError::PrerequisiteNotMet(
            "git および claude コマンドが必要です".to_string(),
        ))
    }
}

pub fn initialize(registry: &dyn BootstrapRegistry) -> AppResult<()> {
    registry
        .initializer()
        .ensure_root_dir()
        .map_err(|e| AppError::IoError(e.to_string()))
}

pub fn teardown(registry: &dyn BootstrapRegistry) -> AppResult<()> {
    registry
        .initializer()
        .remove_root_dir()
        .map_err(|e| AppError::IoError(e.to_string()))
}

pub fn initialize_project(ctx: &ProjectContext, default_branch: &str) -> AppResult<()> {
    ensure_project_dir(ctx, default_branch).map_err(|e| AppError::IoError(e.to_string()))
}

/// worktree が存在しない orphan セッションを削除する
pub fn reconcile_sessions(registry: &dyn AppRegistry) -> AppResult<()> {
    let sessions = registry.session_repository().list()?;
    for session in sessions {
        if !session.worktree_path.exists() {
            registry.session_repository().delete(&session.id)?;
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use data::{AppContext, ProjectId};
    use kernel::manage::initializer::MockInitializer;
    use kernel::manage::prerequisite::MockPrerequisite;
    use kernel::model::session::{Session, SessionId};
    use kernel::repository::session::MockSessionRepository;
    use registry::MockAppRegistry;
    use std::path::PathBuf;
    use std::sync::Arc;

    fn setup() -> std::path::PathBuf {
        shared::utility::test_dir().unwrap()
    }

    fn cleanup(test_dir: &std::path::Path) {
        let _ = std::fs::remove_dir_all(test_dir);
    }

    // テスト用の BootstrapRegistry 実装
    // MockBootstrapRegistry は &dyn Prerequisite の返却が難しいため、手動で用意する
    struct TestBootstrapRegistry {
        initializer: MockInitializer,
        prerequisite: MockPrerequisite,
    }

    impl BootstrapRegistry for TestBootstrapRegistry {
        fn initializer(&self) -> &dyn kernel::manage::initializer::Initializer {
            &self.initializer
        }

        fn prerequisite(&self) -> &dyn kernel::manage::prerequisite::Prerequisite {
            &self.prerequisite
        }
    }

    // 前提条件を満たしている場合は Ok を返す
    #[test]
    fn prerequisite_check_returns_ok_when_all_commands_exist() {
        let mut mock = MockPrerequisite::new();
        mock.expect_check().returning(|| true);

        let registry = TestBootstrapRegistry {
            initializer: MockInitializer::new(),
            prerequisite: mock,
        };
        assert!(prerequisite_check(&registry).is_ok());
    }

    // 前提条件を満たしていない場合は PrerequisiteNotMet エラーを返す
    #[test]
    fn prerequisite_check_returns_err_when_commands_missing() {
        let mut mock = MockPrerequisite::new();
        mock.expect_check().returning(|| false);

        let registry = TestBootstrapRegistry {
            initializer: MockInitializer::new(),
            prerequisite: mock,
        };
        let result = prerequisite_check(&registry);
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            AppError::PrerequisiteNotMet(_)
        ));
    }

    // ensure_root_dir が成功した場合は Ok を返す
    #[test]
    fn initialize_returns_ok_when_ensure_root_dir_succeeds() {
        let mut mock = MockInitializer::new();
        mock.expect_ensure_root_dir().returning(|| Ok(()));

        let registry = TestBootstrapRegistry {
            initializer: mock,
            prerequisite: MockPrerequisite::new(),
        };
        assert!(initialize(&registry).is_ok());
    }

    // ensure_root_dir が失敗した場合は IoError を返す
    #[test]
    fn initialize_returns_io_error_when_ensure_root_dir_fails() {
        let mut mock = MockInitializer::new();
        mock.expect_ensure_root_dir().returning(|| {
            Err(std::io::Error::new(
                std::io::ErrorKind::PermissionDenied,
                "permission denied",
            ))
        });

        let registry = TestBootstrapRegistry {
            initializer: mock,
            prerequisite: MockPrerequisite::new(),
        };
        let result = initialize(&registry);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), AppError::IoError(_)));
    }

    // teardown が成功した場合は Ok を返す
    #[test]
    fn teardown_returns_ok_when_remove_root_dir_succeeds() {
        let mut mock = MockInitializer::new();
        mock.expect_remove_root_dir().returning(|| Ok(()));

        let registry = TestBootstrapRegistry {
            initializer: mock,
            prerequisite: MockPrerequisite::new(),
        };
        assert!(teardown(&registry).is_ok());
    }

    // teardown が失敗した場合は IoError を返す
    #[test]
    fn teardown_returns_io_error_when_remove_root_dir_fails() {
        let mut mock = MockInitializer::new();
        mock.expect_remove_root_dir().returning(|| {
            Err(std::io::Error::new(
                std::io::ErrorKind::PermissionDenied,
                "permission denied",
            ))
        });

        let registry = TestBootstrapRegistry {
            initializer: mock,
            prerequisite: MockPrerequisite::new(),
        };
        let result = teardown(&registry);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), AppError::IoError(_)));
    }

    // initialize_project がプロジェクトディレクトリを作成する
    #[test]
    fn initialize_project_creates_project_directory() {
        let test_dir = setup().join("init_project");
        std::fs::create_dir_all(&test_dir).unwrap();
        let app = Arc::new(AppContext::new(test_dir.clone()));
        let repo_root = std::path::PathBuf::from("/Users/aki/dev/test");
        let id = ProjectId::from(repo_root.as_path());
        let ctx = ProjectContext::new(app, id, repo_root);

        let result = initialize_project(&ctx, "main");
        assert!(result.is_ok());
        assert!(ctx.storage_dir().join("project.json").exists());

        cleanup(&test_dir);
    }

    // initialize_project が IO エラー時に AppError::IoError を返す
    #[test]
    fn initialize_project_returns_io_error_on_failure() {
        let app = Arc::new(AppContext::new(std::path::PathBuf::from(
            "/nonexistent/path",
        )));
        let repo_root = std::path::PathBuf::from("/Users/aki/dev/test");
        let id = ProjectId::from(repo_root.as_path());
        let ctx = ProjectContext::new(app, id, repo_root);

        let result = initialize_project(&ctx, "main");
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), AppError::IoError(_)));
    }

    fn make_session(id: &str, worktree_path: PathBuf) -> Session {
        Session {
            id: SessionId::new(id.to_string()),
            branch_name: "feature/test".to_string(),
            base_branch: "main".to_string(),
            worktree_path,
            created_at: "2026-03-28T12:00:00Z".to_string(),
        }
    }

    // orphan セッション（worktree が存在しない）が削除される
    #[test]
    fn reconcile_sessions_deletes_orphaned_sessions() {
        let orphan = make_session("orphan-id", PathBuf::from("/nonexistent/path"));

        let mut session_mock = MockSessionRepository::new();
        session_mock
            .expect_list()
            .returning(move || Ok(vec![orphan.clone()]));
        session_mock
            .expect_delete()
            .withf(|id| id.as_str() == "orphan-id")
            .times(1)
            .returning(|_| Ok(()));

        let mut registry = MockAppRegistry::new();
        let session = Arc::new(session_mock);
        registry
            .expect_session_repository()
            .returning(move || session.clone());

        let result = reconcile_sessions(&registry);
        assert!(result.is_ok());
    }

    // 有効なセッション（worktree が存在する）は削除されない
    #[test]
    fn reconcile_sessions_keeps_valid_sessions() {
        let test_dir = setup().join("reconcile_valid");
        std::fs::create_dir_all(&test_dir).unwrap();
        let valid = make_session("valid-id", test_dir.clone());

        let mut session_mock = MockSessionRepository::new();
        session_mock
            .expect_list()
            .returning(move || Ok(vec![valid.clone()]));
        // delete は呼ばれないことを times(0) で保証
        session_mock.expect_delete().times(0).returning(|_| Ok(()));

        let mut registry = MockAppRegistry::new();
        let session = Arc::new(session_mock);
        registry
            .expect_session_repository()
            .returning(move || session.clone());

        let result = reconcile_sessions(&registry);
        assert!(result.is_ok());

        cleanup(&test_dir);
    }
}
