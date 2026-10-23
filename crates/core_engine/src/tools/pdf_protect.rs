use lopdf::encryption::crypt_filters::{Aes256CryptFilter, CryptFilter};
use lopdf::encryption::{EncryptionState, EncryptionVersion, Permissions};
use lopdf::{Document, Object};
use std::collections::BTreeMap;
use std::path::Path;
use std::sync::Arc;

use crate::error::EngineError;
use crate::fs_utils;
use crate::models::{FileResult, JobOutput, PdfProtectParams};

pub fn run(params: &PdfProtectParams) -> Result<JobOutput, EngineError> {
    let input_path = Path::new(&params.input_path);
    if !input_path.exists() {
        return Err(EngineError::IoError {
            path: params.input_path.clone(),
            source: std::io::Error::new(std::io::ErrorKind::NotFound, "File does not exist"),
        });
    }

    if params.user_password.trim().is_empty() {
        return Err(EngineError::InvalidParameters(
            "User password cannot be empty".into(),
        ));
    }

    let original_bytes = std::fs::metadata(&params.input_path)
        .map_err(|e| EngineError::IoError {
            path: params.input_path.clone(),
            source: e,
        })?
        .len();

    let mut doc = Document::load(&params.input_path).map_err(|e| {
        EngineError::PdfError(format!("Failed to load PDF for encryption: {}", e))
    })?;

    if doc.is_encrypted() {
        return Err(EngineError::PdfError(
            "PDF is already password-protected. Unlock it first before re-encrypting.".into(),
        ));
    }

    // Ensure document has required ID in trailer for standard PDF encryption
    if !doc.trailer.has(b"ID") {
        let id1: [u8; 16] = rand::random();
        let id2: [u8; 16] = rand::random();
        doc.trailer.set(
            "ID",
            Object::Array(vec![
                Object::string_literal(id1.to_vec()),
                Object::string_literal(id2.to_vec()),
            ]),
        );
    }

    let key: [u8; 32] = rand::random();
    let crypt_filters: BTreeMap<Vec<u8>, Arc<dyn CryptFilter>> =
        BTreeMap::from([(b"StdCF".to_vec(), Arc::new(Aes256CryptFilter) as Arc<dyn CryptFilter>)]);

    let owner_pass = params
        .owner_password
        .as_deref()
        .filter(|s| !s.trim().is_empty())
        .unwrap_or(&params.user_password);

    let version = EncryptionVersion::V5 {
        encrypt_metadata: true,
        crypt_filters,
        file_encryption_key: &key,
        stream_filter: b"StdCF".to_vec(),
        string_filter: b"StdCF".to_vec(),
        owner_password: owner_pass,
        user_password: &params.user_password,
        permissions: Permissions::all(),
    };

    let state = EncryptionState::try_from(version).map_err(|e| {
        EngineError::PdfError(format!("Failed to build AES-256 encryption state: {:?}", e))
    })?;

    doc.encrypt(&state).map_err(|e| {
        EngineError::PdfError(format!("Failed to apply PDF encryption: {}", e))
    })?;

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
        .unwrap_or_else(|| format!("{}_protected.pdf", stem));

    let output_path = fs_utils::get_unique_output_path(Path::new(&params.output_dir), &filename);
    if let Some(parent) = output_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| EngineError::IoError {
            path: parent.to_string_lossy().to_string(),
            source: e,
        })?;
    }

    let output_path_str = output_path.to_string_lossy().to_string();
    doc.save(&output_path)
        .map_err(|e| EngineError::PdfError(format!("Failed to save encrypted PDF: {}", e)))?;

    let result_bytes = std::fs::metadata(&output_path)
        .map_err(|e| EngineError::IoError {
            path: output_path_str.clone(),
            source: e,
        })?
        .len();

    Ok(JobOutput {
        tool: "pdf_protect".into(),
        files: vec![FileResult {
            input_path: params.input_path.clone(),
            output_path: output_path_str,
            original_bytes,
            result_bytes,
        }],
        total_original_bytes: original_bytes,
        total_result_bytes: result_bytes,
        message: Some("PDF encrypted with AES-256 successfully.".into()),
    })
}
