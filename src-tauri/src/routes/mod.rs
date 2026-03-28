mod session;

pub fn handler<R: tauri::Runtime>() -> impl Fn(tauri::ipc::Invoke<R>) -> bool {
    tauri::generate_handler![
        session::create_session,
        session::list_sessions,
        session::delete_session,
    ]
}
