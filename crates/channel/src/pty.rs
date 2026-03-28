use registry::app::AppRegistry;
use shared::error::{AppError, AppResult};
use std::io::Read;

pub fn spawn(
    registry: &dyn AppRegistry,
    session_id: &str,
    cols: u16,
    rows: u16,
) -> AppResult<Option<Box<dyn Read + Send>>> {
    let pty = registry.pty_repository();
    let mut manager = pty.lock().unwrap();

    if manager.has(session_id) {
        return Ok(None);
    }

    let session_id_obj = kernel::model::session::SessionId::new(session_id.to_string());
    let session = registry
        .session_repository()
        .get(&session_id_obj)?
        .ok_or_else(|| AppError::NotFound(format!("Session not found: {session_id}")))?;

    let reader = manager.spawn(session_id, &session.worktree_path, cols, rows)?;

    Ok(Some(reader))
}

pub fn write(registry: &dyn AppRegistry, session_id: &str, data: &[u8]) -> AppResult<()> {
    let pty = registry.pty_repository();
    let mut manager = pty.lock().unwrap();
    manager.write(session_id, data)
}

pub fn resize(registry: &dyn AppRegistry, session_id: &str, cols: u16, rows: u16) -> AppResult<()> {
    let pty = registry.pty_repository();
    let manager = pty.lock().unwrap();
    manager.resize(session_id, cols, rows)
}

pub fn kill(registry: &dyn AppRegistry, session_id: &str) -> AppResult<()> {
    let pty = registry.pty_repository();
    let mut manager = pty.lock().unwrap();
    manager.kill(session_id)
}

pub fn remove(registry: &dyn AppRegistry, session_id: &str) {
    let pty = registry.pty_repository();
    let mut manager = pty.lock().unwrap();
    manager.remove(session_id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use kernel::model::session::{Session, SessionId};
    use kernel::repository::pty::MockPtyRepository;
    use kernel::repository::session::MockSessionRepository;
    use registry::MockAppRegistry;
    use std::path::PathBuf;
    use std::sync::{Arc, Mutex};

    fn make_session(id: &str) -> Session {
        Session {
            id: SessionId::new(id.to_string()),
            branch_name: "feature/test".to_string(),
            base_branch: "main".to_string(),
            worktree_path: PathBuf::from("/tmp/worktree"),
            created_at: "2026-01-01T00:00:00Z".to_string(),
        }
    }

    fn setup_registry(
        session_mock: MockSessionRepository,
        pty_mock: MockPtyRepository,
    ) -> MockAppRegistry {
        let mut registry = MockAppRegistry::new();
        let session = Arc::new(session_mock);
        let pty: Arc<Mutex<dyn kernel::repository::pty::PtyRepository>> =
            Arc::new(Mutex::new(pty_mock));
        registry
            .expect_session_repository()
            .returning(move || session.clone());
        registry
            .expect_pty_repository()
            .returning(move || pty.clone());
        registry
    }

    #[test]
    fn spawn_succeeds_with_valid_session() {
        let mut session_mock = MockSessionRepository::new();
        session_mock
            .expect_get()
            .returning(|id| Ok(Some(make_session(id.as_str()))));

        let mut pty_mock = MockPtyRepository::new();
        pty_mock.expect_has().returning(|_| false);
        pty_mock.expect_spawn().returning(|_, _, _, _| {
            let reader: Box<dyn Read + Send> = Box::new(std::io::empty());
            Ok(reader)
        });

        let registry = setup_registry(session_mock, pty_mock);
        let result = spawn(&registry, "test-session", 80, 24);
        assert!(result.unwrap().is_some());
    }

    #[test]
    fn spawn_skips_when_already_running() {
        let session_mock = MockSessionRepository::new();

        let mut pty_mock = MockPtyRepository::new();
        pty_mock.expect_has().returning(|_| true);

        let registry = setup_registry(session_mock, pty_mock);
        let result = spawn(&registry, "test-session", 80, 24);
        assert!(result.unwrap().is_none());
    }

    #[test]
    fn spawn_fails_when_session_not_found() {
        let mut session_mock = MockSessionRepository::new();
        session_mock.expect_get().returning(|_| Ok(None));

        let mut pty_mock = MockPtyRepository::new();
        pty_mock.expect_has().returning(|_| false);

        let registry = setup_registry(session_mock, pty_mock);
        let result = spawn(&registry, "nonexistent", 80, 24);
        assert!(result.is_err());
    }

    #[test]
    fn write_delegates_to_pty_repository() {
        let session_mock = MockSessionRepository::new();
        let mut pty_mock = MockPtyRepository::new();
        pty_mock.expect_write().returning(|_, _| Ok(()));

        let registry = setup_registry(session_mock, pty_mock);
        let result = write(&registry, "test-session", b"hello");
        assert!(result.is_ok());
    }

    #[test]
    fn resize_delegates_to_pty_repository() {
        let session_mock = MockSessionRepository::new();
        let mut pty_mock = MockPtyRepository::new();
        pty_mock.expect_resize().returning(|_, _, _| Ok(()));

        let registry = setup_registry(session_mock, pty_mock);
        let result = resize(&registry, "test-session", 120, 40);
        assert!(result.is_ok());
    }

    #[test]
    fn kill_delegates_to_pty_repository() {
        let session_mock = MockSessionRepository::new();
        let mut pty_mock = MockPtyRepository::new();
        pty_mock.expect_kill().returning(|_| Ok(()));

        let registry = setup_registry(session_mock, pty_mock);
        let result = kill(&registry, "test-session");
        assert!(result.is_ok());
    }
}
