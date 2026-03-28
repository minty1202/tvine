use std::sync::Arc;

use api::operator;
use client::git::{Client as GitClientTrait, ClientImpl as GitClient};
use data::{AppContext, ProjectContext, ProjectId};
use registry::BootstrapRegistryImpl;
use shared::utility;

fn setup(_app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let home_dir = utility::home_dir()?;

    let app_ctx = AppContext::new(home_dir.clone());
    let bootstrap = BootstrapRegistryImpl::new(app_ctx);

    operator::prerequisite_check(&bootstrap)?;
    operator::initialize(&bootstrap)?;

    let app_context = Arc::new(AppContext::new(home_dir));
    let git_client = GitClient::new()?;
    let repository_root = git_client.project_root();
    let default_branch = git_client.default_branch();
    let project_id = ProjectId::from(repository_root.as_path());
    let project_ctx = ProjectContext::new(app_context, project_id, repository_root);

    operator::initialize_project(&project_ctx, &default_branch)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(setup)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
