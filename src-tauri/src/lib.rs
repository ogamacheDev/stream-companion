use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager, State};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;
use argon2::{self, Config};
use rand::RngCore;
use base64::Engine;

pub struct SidecarState {
    child: Arc<Mutex<Option<CommandChild>>>,
}

#[tauri::command]
fn vault_password(app: tauri::AppHandle) -> Result<String, String> {
    let service = "com.olliedev.streamerbot-companion";
    let username = "stronghold-vault-password";

    let entry = keyring::Entry::new(service, username).map_err(|e| e.to_string())?;

    // Try read existing
    if let Ok(existing) = entry.get_password() {
        if !existing.is_empty() {
            return Ok(existing);
        }
    }

    // Create new random password and store it
    let mut buf = [0u8; 32];
    rand::rngs::OsRng.fill_bytes(&mut buf);

    let pw = base64::engine::general_purpose::STANDARD_NO_PAD.encode(buf);

    entry.set_password(&pw).map_err(|e| e.to_string())?;
    Ok(pw)
}

#[tauri::command]
fn kill_sidecar(state: State<SidecarState>) -> Result<(), String> {
    if let Some(mut child) = state.child.lock().unwrap().take() {
        child.kill().map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Sidecar not running".to_string())
    }
}

pub fn start_sidecar(app: &AppHandle) {
    let sidecar_command = app.shell().sidecar("app").unwrap();
    let (mut rx, child) = sidecar_command.spawn().expect("Failed to spawn sidecar");

    let child_arc = Arc::new(Mutex::new(Some(child)));
    app.manage(SidecarState {
        child: child_arc.clone(),
    });

    // Spawn an async task to handle events
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    let text = String::from_utf8_lossy(&line);
                    println!("[Sidecar STDOUT]: {}", text);
                }
                CommandEvent::Stderr(line) => {
                    let text = String::from_utf8_lossy(&line);
                    eprintln!("[Sidecar STDERR]: {}", text);
                }
                CommandEvent::Terminated(payload) => {
                    println!("[Sidecar] Terminated with code: {:?}", payload.code);
                }
                _ => {}
            }
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let salt_path = app
                .path()
                .app_local_data_dir()
                .expect("could not resolve app local data path")
                .join("salt.txt");

            app.handle()
                .plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())?;

            start_sidecar(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![kill_sidecar, vault_password])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
