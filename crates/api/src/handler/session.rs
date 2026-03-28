use kernel::model::session::{Session, SessionId};
use registry::AppRegistry;
use shared::error::{AppError, AppResult};

pub fn delete_session(registry: &dyn AppRegistry, session_id: &str) -> AppResult<()> {
    let id = SessionId::new(session_id.to_string());
    let session = registry
        .session_repository()
        .get(&id)?
        .ok_or_else(|| AppError::NotFound(format!("セッション {} が見つかりません", session_id)))?;

    // worktree 削除（存在しない場合はスキップ）
    if session.worktree_path.exists() {
        registry
            .git_repository()
            .force_remove_worktree(&session.worktree_path)?;
    }

    // session.json 削除
    registry.session_repository().delete(&id)?;

    Ok(())
}

pub fn list_sessions(registry: &dyn AppRegistry) -> AppResult<Vec<Session>> {
    let sessions = registry.session_repository().list()?;

    let mut valid = Vec::new();
    for session in sessions {
        if session.worktree_path.exists() {
            valid.push(session);
        } else {
            // orphan セッションを削除
            registry.session_repository().delete(&session.id)?;
        }
    }

    valid.sort_by(|a, b| a.created_at.cmp(&b.created_at));
    Ok(valid)
}

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
        claude_launched: false,
    };

    // session.json 保存（失敗時はロールバック）
    if let Err(e) = registry.session_repository().create(&session) {
        let _ = registry
            .git_repository()
            .force_remove_worktree(&worktree_path);
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
            .expect_force_remove_worktree()
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

    // --- delete_session ---

    #[test]
    fn delete_session_removes_worktree_and_session() {
        let tmp = tempfile::tempdir().unwrap();
        let worktree_path = tmp.path().to_path_buf();

        let session = Session {
            id: SessionId::new("del-uuid".to_string()),
            branch_name: "feature/del".to_string(),
            base_branch: "main".to_string(),
            worktree_path: worktree_path.clone(),
            created_at: "2026-03-28T12:00:00Z".to_string(),
            claude_launched: false,
        };

        let mut git_mock = MockGitRepository::new();
        git_mock
            .expect_force_remove_worktree()
            .withf(move |p| p == worktree_path)
            .times(1)
            .returning(|_| Ok(()));

        let mut session_mock = MockSessionRepository::new();
        let session_clone = session.clone();
        session_mock
            .expect_get()
            .returning(move |_| Ok(Some(session_clone.clone())));
        session_mock.expect_delete().times(1).returning(|_| Ok(()));

        let registry = setup_mock_registry(git_mock, session_mock);
        let result = delete_session(&registry, "del-uuid");
        assert!(result.is_ok());
    }

    #[test]
    fn delete_session_skips_worktree_when_already_removed() {
        let session = Session {
            id: SessionId::new("del-orphan".to_string()),
            branch_name: "feature/orphan".to_string(),
            base_branch: "main".to_string(),
            worktree_path: PathBuf::from("/nonexistent/worktree"),
            created_at: "2026-03-28T12:00:00Z".to_string(),
            claude_launched: false,
        };

        let git_mock = MockGitRepository::new();
        // force_remove_worktree は呼ばれない

        let mut session_mock = MockSessionRepository::new();
        let session_clone = session.clone();
        session_mock
            .expect_get()
            .returning(move |_| Ok(Some(session_clone.clone())));
        session_mock.expect_delete().times(1).returning(|_| Ok(()));

        let registry = setup_mock_registry(git_mock, session_mock);
        let result = delete_session(&registry, "del-orphan");
        assert!(result.is_ok());
    }

    #[test]
    fn delete_session_returns_not_found_when_session_missing() {
        let git_mock = MockGitRepository::new();

        let mut session_mock = MockSessionRepository::new();
        session_mock.expect_get().returning(|_| Ok(None));

        let registry = setup_mock_registry(git_mock, session_mock);
        let result = delete_session(&registry, "nonexistent");
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), AppError::NotFound(_)));
    }

    #[test]
    fn delete_session_fails_when_worktree_removal_fails() {
        let tmp = tempfile::tempdir().unwrap();
        let session = Session {
            id: SessionId::new("del-fail".to_string()),
            branch_name: "feature/fail".to_string(),
            base_branch: "main".to_string(),
            worktree_path: tmp.path().to_path_buf(),
            created_at: "2026-03-28T12:00:00Z".to_string(),
            claude_launched: false,
        };

        let mut git_mock = MockGitRepository::new();
        git_mock
            .expect_force_remove_worktree()
            .returning(|_| Err(AppError::GitError("worktree removal failed".into())));

        let mut session_mock = MockSessionRepository::new();
        let session_clone = session.clone();
        session_mock
            .expect_get()
            .returning(move |_| Ok(Some(session_clone.clone())));

        let registry = setup_mock_registry(git_mock, session_mock);
        let result = delete_session(&registry, "del-fail");
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), AppError::GitError(_)));
    }

    // --- list_sessions ---

    #[test]
    fn list_sessions_returns_valid_sessions_sorted() {
        let tmp1 = tempfile::tempdir().unwrap();
        let tmp2 = tempfile::tempdir().unwrap();

        let session_b = Session {
            id: SessionId::new("uuid-b".to_string()),
            branch_name: "feature/b".to_string(),
            base_branch: "main".to_string(),
            worktree_path: tmp1.path().to_path_buf(),
            created_at: "2026-03-28T14:00:00Z".to_string(),
            claude_launched: false,
        };
        let session_a = Session {
            id: SessionId::new("uuid-a".to_string()),
            branch_name: "feature/a".to_string(),
            base_branch: "main".to_string(),
            worktree_path: tmp2.path().to_path_buf(),
            created_at: "2026-03-28T12:00:00Z".to_string(),
            claude_launched: false,
        };

        let git_mock = MockGitRepository::new();

        let mut session_mock = MockSessionRepository::new();
        let b = session_b.clone();
        let a = session_a.clone();
        session_mock
            .expect_list()
            .returning(move || Ok(vec![b.clone(), a.clone()]));
        session_mock.expect_delete().times(0).returning(|_| Ok(()));

        let registry = setup_mock_registry(git_mock, session_mock);
        let result = list_sessions(&registry).unwrap();

        assert_eq!(result.len(), 2);
        assert_eq!(result[0].id.as_str(), "uuid-a");
        assert_eq!(result[1].id.as_str(), "uuid-b");
    }

    #[test]
    fn list_sessions_filters_out_orphan_sessions() {
        let tmp = tempfile::tempdir().unwrap();

        let valid = Session {
            id: SessionId::new("valid-id".to_string()),
            branch_name: "feature/valid".to_string(),
            base_branch: "main".to_string(),
            worktree_path: tmp.path().to_path_buf(),
            created_at: "2026-03-28T12:00:00Z".to_string(),
            claude_launched: false,
        };
        let orphan = Session {
            id: SessionId::new("orphan-id".to_string()),
            branch_name: "feature/orphan".to_string(),
            base_branch: "main".to_string(),
            worktree_path: PathBuf::from("/nonexistent/worktree"),
            created_at: "2026-03-28T13:00:00Z".to_string(),
            claude_launched: false,
        };

        let git_mock = MockGitRepository::new();

        let mut session_mock = MockSessionRepository::new();
        let v = valid.clone();
        let o = orphan.clone();
        session_mock
            .expect_list()
            .returning(move || Ok(vec![v.clone(), o.clone()]));
        session_mock
            .expect_delete()
            .withf(|id| id.as_str() == "orphan-id")
            .times(1)
            .returning(|_| Ok(()));

        let registry = setup_mock_registry(git_mock, session_mock);
        let result = list_sessions(&registry).unwrap();

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].id.as_str(), "valid-id");
    }

    #[test]
    fn list_sessions_returns_empty_when_no_sessions() {
        let git_mock = MockGitRepository::new();

        let mut session_mock = MockSessionRepository::new();
        session_mock.expect_list().returning(|| Ok(vec![]));

        let registry = setup_mock_registry(git_mock, session_mock);
        let result = list_sessions(&registry).unwrap();
        assert!(result.is_empty());
    }

    // --- create_session ---

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
