use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum EngineError {
    #[error("Invalid JSON payload: {0}")]
    JsonError(#[from] serde_json::Error),

    #[error("File I/O error on '{path}': {source}")]
    IoError {
        path: String,
        #[source]
        source: std::io::Error,
    },

    #[error("PDF processing error: {0}")]
    PdfError(String),

    #[error("Image processing error: {0}")]
    ImageError(String),

    #[error("Invalid parameters: {0}")]
    InvalidParameters(String),

    #[error("Operation failed: {0}")]
    General(String),
}

impl From<lopdf::Error> for EngineError {
    fn from(err: lopdf::Error) -> Self {
        EngineError::PdfError(err.to_string())
    }
}

impl From<image::ImageError> for EngineError {
    fn from(err: image::ImageError) -> Self {
        EngineError::ImageError(err.to_string())
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct EngineErrorDetails {
    pub code: String,
    pub message: String,
}

impl EngineError {
    pub fn to_details(&self) -> EngineErrorDetails {
        let code = match self {
            EngineError::JsonError(_) => "INVALID_JSON",
            EngineError::IoError { .. } => "IO_ERROR",
            EngineError::PdfError(_) => "PDF_PROCESSING_ERROR",
            EngineError::ImageError(_) => "IMAGE_PROCESSING_ERROR",
            EngineError::InvalidParameters(_) => "INVALID_PARAMETERS",
            EngineError::General(_) => "OPERATION_FAILED",
        };
        EngineErrorDetails {
            code: code.to_string(),
            message: self.to_string(),
        }
    }
}
