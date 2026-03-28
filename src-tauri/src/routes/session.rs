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
