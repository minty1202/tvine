use registry::AppRegistryState;

#[tauri::command]
pub fn create_session(
    base_branch: String,
    branch_name: String,
    _state: tauri::State<'_, AppRegistryState>,
) -> Result<(), String> {
    println!(
        "create_session: base_branch={}, branch_name={}",
        base_branch, branch_name
    );
    Ok(())
}
