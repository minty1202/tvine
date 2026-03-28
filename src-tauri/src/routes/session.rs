use kernel::model::session::Session;
use registry::AppRegistryState;

#[tauri::command]
pub fn create_session(
    base_branch: String,
    branch_name: String,
    state: tauri::State<'_, AppRegistryState>,
) -> Result<Session, String> {
    api::handler::session::create_session(&**state, &base_branch, &branch_name)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_sessions(state: tauri::State<'_, AppRegistryState>) -> Result<Vec<Session>, String> {
    api::handler::session::list_sessions(&**state).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_session(
    session_id: String,
    state: tauri::State<'_, AppRegistryState>,
) -> Result<(), String> {
    let _ = channel::pty::kill(&**state, &session_id);
    api::handler::session::delete_session(&**state, &session_id).map_err(|e| e.to_string())
}
