#[tauri::command]
async fn run_job(payload: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        core_engine::execute_job(&payload)
    })
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_default_output_dir() -> String {
    if let Some(mut download_dir) = dirs::download_dir() {
        download_dir.push("DocChisel");
        return download_dir.to_string_lossy().to_string();
    }
    if let Some(mut doc_dir) = dirs::document_dir() {
        doc_dir.push("DocChisel");
        return doc_dir.to_string_lossy().to_string();
    }
    "DocChisel_Output".to_string()
}

#[tauri::command]
fn get_pdf_page_count(path: String) -> Result<usize, String> {
    core_engine::get_pdf_page_count(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn show_in_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let mut cmd = std::process::Command::new("open");
        if std::path::Path::new(&path).is_file() {
            cmd.arg("-R");
        }
        cmd.arg(&path).spawn().map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        let mut cmd = std::process::Command::new("explorer");
        if std::path::Path::new(&path).is_file() {
            cmd.arg(format!("/select,\"{}\"", path));
        } else {
            cmd.arg(&path);
        }
        cmd.spawn().map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        let p = std::path::Path::new(&path);
        let target = if p.is_file() {
            p.parent().unwrap_or(p)
        } else {
            p
        };
        std::process::Command::new("xdg-open")
            .arg(target)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            run_job,
            get_default_output_dir,
            get_pdf_page_count,
            show_in_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running docchisel desktop application");
}
