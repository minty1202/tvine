use std::io::Read;
use std::sync::Arc;
use std::thread;

use registry::AppRegistryState;
use serde::Serialize;
use tauri::Emitter;

pub type AppHandleState = Arc<tauri::AppHandle>;

#[derive(Clone, Serialize)]
struct PtyOutputPayload {
    session_id: String,
    data: Vec<u8>,
}

#[derive(Clone, Serialize)]
struct PtyExitPayload {
    session_id: String,
}

#[tauri::command]
pub fn spawn_pty(
    session_id: String,
    cols: u16,
    rows: u16,
    state: tauri::State<'_, AppRegistryState>,
    handle_state: tauri::State<'_, AppHandleState>,
) -> Result<(), String> {
    if channel::pty::has(&**state, &session_id) {
        return Ok(());
    }

    let reader =
        channel::pty::spawn(&**state, &session_id, cols, rows).map_err(|e| e.to_string())?;

    let app_handle = (**handle_state).clone();
    let registry = Arc::clone(&*state);
    start_read_loop(reader, session_id, app_handle, registry);

    Ok(())
}

#[tauri::command]
pub fn write_pty(
    session_id: String,
    data: Vec<u8>,
    state: tauri::State<'_, AppRegistryState>,
) -> Result<(), String> {
    channel::pty::write(&**state, &session_id, &data).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn resize_pty(
    session_id: String,
    cols: u16,
    rows: u16,
    state: tauri::State<'_, AppRegistryState>,
) -> Result<(), String> {
    channel::pty::resize(&**state, &session_id, cols, rows).map_err(|e| e.to_string())
}

fn start_read_loop(
    mut reader: Box<dyn Read + Send>,
    session_id: String,
    app_handle: tauri::AppHandle,
    registry: AppRegistryState,
) {
    thread::spawn(move || {
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) | Err(_) => {
                    channel::pty::remove(&*registry, &session_id);
                    let _ = app_handle.emit(
                        "pty-exit",
                        PtyExitPayload {
                            session_id: session_id.clone(),
                        },
                    );
                    break;
                }
                Ok(n) => {
                    let _ = app_handle.emit(
                        "pty-output",
                        PtyOutputPayload {
                            session_id: session_id.clone(),
                            data: buf[..n].to_vec(),
                        },
                    );
                }
            }
        }
    });
}
