use crate::{ProjectContext, SESSIONS_DIR_NAME};
use kernel::model::session::Session;
use std::io;

const SESSION_CONFIG_FILE: &str = "session.json";

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

    fn setup() -> PathBuf {
        let test_dir = shared::utility::test_dir().unwrap();
        let _ = std::fs::remove_dir_all(&test_dir);
        test_dir
    }

    fn cleanup(test_dir: &std::path::Path) {
        let _ = std::fs::remove_dir_all(test_dir);
    }

    #[test]
    fn save_session_creates_session_json() {
        let test_dir = setup().join("save_session");
        std::fs::create_dir_all(&test_dir).unwrap();
        let app = Arc::new(AppContext::new(test_dir.clone()));
        let repo_root = PathBuf::from("/Users/aki/dev/test");
        let id = ProjectId::from(repo_root.as_path());
        let ctx = ProjectContext::new(app, id, repo_root);

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

        cleanup(&test_dir);
    }
}
