pub(crate) mod pty;
mod session;

pub fn handler<R: tauri::Runtime>() -> impl Fn(tauri::ipc::Invoke<R>) -> bool {
    tauri::generate_handler![
        session::create_session,
        session::list_sessions,
        session::delete_session,
        pty::spawn_pty,
        pty::write_pty,
        pty::resize_pty,
    ]
}
