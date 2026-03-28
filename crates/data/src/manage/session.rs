use crate::{ProjectContext, SESSIONS_DIR_NAME};
use kernel::model::session::Session;
use std::io;

const SESSION_CONFIG_FILE: &str = "session.json";

pub fn get_session(ctx: &ProjectContext, session_id: &str) -> io::Result<Option<Session>> {
    let config_path = ctx
        .storage_dir()
        .join(SESSIONS_DIR_NAME)
        .join(session_id)
        .join(SESSION_CONFIG_FILE);

    if !config_path.exists() {
        return Ok(None);
    }

    let json = std::fs::read_to_string(&config_path)?;
    let session: Session = serde_json::from_str(&json).map_err(io::Error::other)?;
    Ok(Some(session))
}

pub fn list_sessions(ctx: &ProjectContext) -> io::Result<Vec<Session>> {
    let sessions_dir = ctx.storage_dir().join(SESSIONS_DIR_NAME);
    if !sessions_dir.exists() {
        return Ok(vec![]);
    }

    let mut sessions = Vec::new();
    for entry in std::fs::read_dir(&sessions_dir)? {
        let entry = entry?;
        let config_path = entry.path().join(SESSION_CONFIG_FILE);
        if config_path.exists() {
            let json = std::fs::read_to_string(&config_path)?;
            let session: Session = serde_json::from_str(&json).map_err(io::Error::other)?;
            sessions.push(session);
        }
    }

    Ok(sessions)
}

pub fn delete_session(ctx: &ProjectContext, session_id: &str) -> io::Result<()> {
    let session_dir = ctx.storage_dir().join(SESSIONS_DIR_NAME).join(session_id);

    if session_dir.exists() {
        std::fs::remove_dir_all(&session_dir)?;
    }

    Ok(())
}

pub fn save_session(ctx: &ProjectContext, session: &Session) -> io::Result<()> {
    let session_dir = ctx
        .storage_dir()
        .join(SESSIONS_DIR_NAME)
        .join(session.id.as_str());

    std::fs::create_dir_all(&session_dir)?;

    let json = serde_json::to_string_pretty(session).map_err(io::Error::other)?;
    std::fs::write(session_dir.join(SESSION_CONFIG_FILE), json)?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{AppContext, ProjectId};
    use kernel::model::session::SessionId;
    use std::path::PathBuf;
    use std::sync::Arc;

    fn make_ctx(base: &std::path::Path) -> ProjectContext {
        let app = Arc::new(AppContext::new(base.to_path_buf()));
        let repo_root = PathBuf::from("/Users/aki/dev/test");
        let id = ProjectId::from(repo_root.as_path());
        ProjectContext::new(app, id, repo_root)
    }

    fn make_session(id: &str, branch: &str) -> Session {
        Session {
            id: SessionId::new(id.to_string()),
            branch_name: branch.to_string(),
            base_branch: "main".to_string(),
            worktree_path: PathBuf::from(format!("/Users/aki/dev/test-{}", branch)),
            created_at: "2026-03-28T12:00:00Z".to_string(),
        }
    }

    #[test]
    fn save_session_creates_session_json() {
        let tmp = tempfile::tempdir().unwrap();
        let ctx = make_ctx(tmp.path());

        let session = Session {
            id: SessionId::new("test-uuid-1234".to_string()),
            branch_name: "feature/login".to_string(),
            base_branch: "main".to_string(),
            worktree_path: PathBuf::from("/Users/aki/dev/test-feature-login"),
            created_at: "2026-03-28T12:00:00Z".to_string(),
        };

        let result = save_session(&ctx, &session);
        assert!(result.is_ok());

        let session_dir = ctx.storage_dir().join("sessions").join("test-uuid-1234");
        assert!(session_dir.join("session.json").exists());

        let saved: serde_json::Value = serde_json::from_str(
            &std::fs::read_to_string(session_dir.join("session.json")).unwrap(),
        )
        .unwrap();
        assert_eq!(saved["id"], "test-uuid-1234");
        assert_eq!(saved["branch_name"], "feature/login");
        assert_eq!(saved["base_branch"], "main");
    }

    #[test]
    fn list_sessions_returns_saved_sessions() {
        let tmp = tempfile::tempdir().unwrap();
        let ctx = make_ctx(tmp.path());

        save_session(&ctx, &make_session("uuid-1", "feature/a")).unwrap();
        save_session(&ctx, &make_session("uuid-2", "feature/b")).unwrap();

        let sessions = list_sessions(&ctx).unwrap();
        assert_eq!(sessions.len(), 2);
    }

    #[test]
    fn list_sessions_returns_empty_when_no_sessions_dir() {
        let tmp = tempfile::tempdir().unwrap();
        let ctx = make_ctx(tmp.path());

        let sessions = list_sessions(&ctx).unwrap();
        assert!(sessions.is_empty());
    }

    #[test]
    fn get_session_returns_saved_session() {
        let tmp = tempfile::tempdir().unwrap();
        let ctx = make_ctx(tmp.path());

        save_session(&ctx, &make_session("uuid-get", "feature/get")).unwrap();

        let result = get_session(&ctx, "uuid-get").unwrap();
        assert!(result.is_some());
        let session = result.unwrap();
        assert_eq!(session.id.as_str(), "uuid-get");
        assert_eq!(session.branch_name, "feature/get");
    }

    #[test]
    fn get_session_returns_none_when_not_found() {
        let tmp = tempfile::tempdir().unwrap();
        let ctx = make_ctx(tmp.path());

        let result = get_session(&ctx, "nonexistent").unwrap();
        assert!(result.is_none());
    }

    #[test]
    fn delete_session_removes_session_dir() {
        let tmp = tempfile::tempdir().unwrap();
        let ctx = make_ctx(tmp.path());

        save_session(&ctx, &make_session("uuid-del", "feature/x")).unwrap();
        assert!(ctx
            .storage_dir()
            .join("sessions/uuid-del/session.json")
            .exists());

        delete_session(&ctx, "uuid-del").unwrap();
        assert!(!ctx.storage_dir().join("sessions/uuid-del").exists());
    }
}
