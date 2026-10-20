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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_default_output_dir() {
        let dir = get_default_output_dir();
        assert!(!dir.is_empty(), "Default output dir should not be empty");
        assert!(
            dir.ends_with("DocChisel") || dir.ends_with("DocChisel_Output"),
            "Default output dir should end with DocChisel, got: {}",
            dir
        );
    }

    #[test]
    fn test_run_job_invalid_payload() {
        let rt = tokio::runtime::Runtime::new().expect("Failed to create tokio runtime");
        let result = rt.block_on(run_job("invalid json".to_string()));
        assert!(result.is_ok(), "run_job should return Result with JSON error");
        let res_str = result.unwrap();
        assert!(
            res_str.contains("\"success\":false") || res_str.contains("error"),
            "Response should indicate failure: {}",
            res_str
        );
    }

    #[test]
    fn test_get_pdf_page_count_nonexistent() {
        let result = get_pdf_page_count("/path/to/nonexistent/docchisel_test.pdf".to_string());
        assert!(result.is_err(), "Should return error for nonexistent file");
    }
}

