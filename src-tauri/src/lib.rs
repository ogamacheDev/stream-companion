
use std::sync::{Arc, Mutex};
use tauri::{Manager};
use tauri_plugin_shell::process::{CommandEvent};
use tauri_plugin_shell::ShellExt;
use rand::Rng;

pub struct AppState {
    pub auth_token: Arc<Mutex<String>>,
    child: Mutex<Option<tauri_plugin_shell::process::CommandChild>>
}

#[tauri::command]
fn get_auth_token(state: tauri::State<'_, AppState>) -> String {
    let token = state.auth_token.lock().unwrap();
    token.clone()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_keyring::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Stronghold
            let salt_path = app
                .path()
                .app_local_data_dir()
                .expect("could not resolve backend local data path")
                .join("salt.txt");
            app.handle().plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())?;

            // Backend
            let token: String = rand::thread_rng()
                .sample_iter(&rand::distributions::Alphanumeric)
                .take(32)
                .map(char::from)
                .collect();

            let sidecar = app.shell().sidecar("backend").unwrap();
            let (mut rx, child) = sidecar
                .env("AUTH_TOKEN", &token)
                .spawn()
                .unwrap();

            app.manage(AppState {
                child: Mutex::new(Some(child)),
                auth_token: Arc::new(Mutex::new(token.clone()))
            });

            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(line) => {
                            let text = String::from_utf8_lossy(&line);
                            println!("{}", text);
                        }
                        CommandEvent::Stderr(line) => {
                            let text = String::from_utf8_lossy(&line);
                            eprintln!("Backend Error: {}", text);
                        }
                        CommandEvent::Terminated(payload) => {
                            println!("Backend Terminated: {:?}", payload.code);
                        }
                        _ => {}
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_auth_token])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            match event {
                // 4. Intercept the Exit event to kill the sidecar
                tauri::RunEvent::Exit => {
                    let state = app_handle.state::<AppState>();
                    let mut child_lock = state.child.lock().unwrap();
                    if let Some(child) = child_lock.take() {
                        println!("Killing sidecar process...");
                        let _ = child.kill();
                    }
                }
                _ => {}
            }
        });
}
