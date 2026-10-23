use lopdf::Document;
use std::path::Path;

use crate::error::EngineError;
use crate::fs_utils;
use crate::models::{FileResult, JobOutput, PdfUnlockParams};

pub fn run(params: &PdfUnlockParams) -> Result<JobOutput, EngineError> {
    let input_path = Path::new(&params.input_path);
    if !input_path.exists() {
        return Err(EngineError::IoError {
            path: params.input_path.clone(),
            source: std::io::Error::new(std::io::ErrorKind::NotFound, "File does not exist"),
        });
    }

    let original_bytes = std::fs::metadata(&params.input_path)
        .map_err(|e| EngineError::IoError {
            path: params.input_path.clone(),
            source: e,
        })?
        .len();

    let mut doc = Document::load_with_password(&params.input_path, &params.password).map_err(|e| {
        EngineError::PdfError(format!(
            "Failed to open protected PDF (please verify the password): {}",
            e
        ))
    })?;

    if doc.is_encrypted() {
        let _ = doc.decrypt(&params.password);
    }

    // Remove the encryption specification so saved copy is unencrypted
    doc.trailer.remove(b"Encrypt");

    let stem = input_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("document");
    let filename = params
        .output_filename
        .clone()
        .filter(|s| !s.trim().is_empty())
        .map(|s| {
            if s.to_lowercase().ends_with(".pdf") {
                s
            } else {
                format!("{}.pdf", s)
            }
        })
        .unwrap_or_else(|| format!("{}_unlocked.pdf", stem));

    let output_path = fs_utils::get_unique_output_path(Path::new(&params.output_dir), &filename);
    if let Some(parent) = output_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| EngineError::IoError {
            path: parent.to_string_lossy().to_string(),
            source: e,
        })?;
    }

    let output_path_str = output_path.to_string_lossy().to_string();
    doc.save(&output_path)
        .map_err(|e| EngineError::PdfError(format!("Failed to save unlocked PDF: {}", e)))?;

    let result_bytes = std::fs::metadata(&output_path)
        .map_err(|e| EngineError::IoError {
            path: output_path_str.clone(),
            source: e,
        })?
        .len();

    Ok(JobOutput {
        tool: "pdf_unlock".into(),
        files: vec![FileResult {
            input_path: params.input_path.clone(),
            output_path: output_path_str,
            original_bytes,
            result_bytes,
        }],
        total_original_bytes: original_bytes,
        total_result_bytes: result_bytes,
        message: Some("PDF unlocked and password protection removed successfully.".into()),
    })
}
