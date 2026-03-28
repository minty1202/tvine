use kernel::model::session::{Session, SessionId};
use registry::AppRegistry;
use shared::error::{AppError, AppResult};

pub fn create_session(
    registry: &dyn AppRegistry,
    base_branch: &str,
    branch_name: &str,
) -> AppResult<Session> {
    let session_id = SessionId::new(uuid::Uuid::new_v4().to_string());
    let created_at = chrono::Utc::now().to_rfc3339();

    let project_root = registry.git_repository().project_root();
    let repo_name = project_root
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();
    let dir_name = format!("{}-{}", repo_name, branch_name.replace('/', "-"));
    let worktree_path = project_root
        .parent()
        .ok_or_else(|| AppError::GitError("リポジトリの親ディレクトリが見つかりません".into()))?
        .join(&dir_name);

    // worktree 作成
    registry
        .git_repository()
        .create_worktree(base_branch, branch_name, &worktree_path)?;

    let session = Session {
        id: session_id,
        branch_name: branch_name.to_string(),
        base_branch: base_branch.to_string(),
        worktree_path: worktree_path.clone(),
        created_at,
    };

    // session.json 保存（失敗時はロールバック）
    if let Err(e) = registry.session_repository().create(&session) {
        let _ = registry.git_repository().remove_worktree(&worktree_path);
        return Err(e);
    }

    Ok(session)
}

#[cfg(test)]
mod tests {
    use super::*;
    use kernel::repository::git::MockGitRepository;
    use kernel::repository::session::MockSessionRepository;
    use registry::MockAppRegistry;
    use std::path::PathBuf;
    use std::sync::Arc;

    fn setup_mock_registry(
        git_mock: MockGitRepository,
        session_mock: MockSessionRepository,
    ) -> MockAppRegistry {
        let mut registry = MockAppRegistry::new();
        let git = Arc::new(git_mock);
        let session = Arc::new(session_mock);
        registry
            .expect_git_repository()
            .returning(move || git.clone());
        registry
            .expect_session_repository()
            .returning(move || session.clone());
        registry
    }

    #[test]
    fn create_session_succeeds() {
        let mut git_mock = MockGitRepository::new();
        git_mock
            .expect_project_root()
            .returning(|| PathBuf::from("/Users/aki/dev/tvine"));
        git_mock
            .expect_create_worktree()
            .withf(|base, branch, path| {
                base == "main"
                    && branch == "feature/login"
                    && path.to_string_lossy().contains("tvine-feature-login")
            })
            .returning(|_, _, _| Ok(()));

        let mut session_mock = MockSessionRepository::new();
        session_mock.expect_create().returning(|_| Ok(()));

        let registry = setup_mock_registry(git_mock, session_mock);
        let result = create_session(&registry, "main", "feature/login");

        assert!(result.is_ok());
        let session = result.unwrap();
        assert_eq!(session.branch_name, "feature/login");
        assert_eq!(session.base_branch, "main");
        assert!(session
            .worktree_path
            .to_string_lossy()
            .contains("tvine-feature-login"));
    }

    #[test]
    fn create_session_rolls_back_on_save_failure() {
        let mut git_mock = MockGitRepository::new();
        git_mock
            .expect_project_root()
            .returning(|| PathBuf::from("/Users/aki/dev/tvine"));
        git_mock
            .expect_create_worktree()
            .returning(|_, _, _| Ok(()));
        git_mock
            .expect_remove_worktree()
            .times(1)
            .returning(|_| Ok(()));

        let mut session_mock = MockSessionRepository::new();
        session_mock
            .expect_create()
            .returning(|_| Err(AppError::IoError("disk full".into())));

        let registry = setup_mock_registry(git_mock, session_mock);
        let result = create_session(&registry, "main", "feature/login");

        assert!(result.is_err());
    }

    #[test]
    fn create_session_fails_on_worktree_error() {
        let mut git_mock = MockGitRepository::new();
        git_mock
            .expect_project_root()
            .returning(|| PathBuf::from("/Users/aki/dev/tvine"));
        git_mock
            .expect_create_worktree()
            .returning(|_, _, _| Err(AppError::GitError("branch already exists".into())));

        let session_mock = MockSessionRepository::new();

        let registry = setup_mock_registry(git_mock, session_mock);
        let result = create_session(&registry, "main", "feature/login");

        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), AppError::GitError(_)));
    }
}
