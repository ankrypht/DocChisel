pub mod dispatcher;
pub mod error;
pub mod ffi;
pub mod fs_utils;
pub mod models;
pub mod tools;

pub use dispatcher::execute_job;
pub use error::EngineError;
pub use fs_utils::get_unique_output_path;
pub use models::{JobOutput, JobRequest, JobResponse};

uniffi::setup_scaffolding!("docchisel_core");

/// UniFFI single entry point for mobile Swift and Kotlin bindings
#[uniffi::export]
pub fn docchisel_execute_job_uniffi(payload_json: String) -> String {
    execute_job(&payload_json)
}

/// Read total number of pages in a PDF document quickly
pub fn get_pdf_page_count(path: &str) -> Result<usize, EngineError> {
    let doc = lopdf::Document::load(path)?;
    Ok(doc.get_pages().len())
}

