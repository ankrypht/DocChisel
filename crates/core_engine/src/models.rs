use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileResult {
    pub input_path: String,
    pub output_path: String,
    pub original_bytes: u64,
    pub result_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobOutput {
    pub tool: String,
    pub files: Vec<FileResult>,
    pub total_original_bytes: u64,
    pub total_result_bytes: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct JobResponse {
    pub success: boolean_or_status::Status,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output: Option<JobOutput>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<crate::error::EngineErrorDetails>,
}

mod boolean_or_status {
    use serde::{Serialize, Serializer};

    #[derive(Debug, Clone, Copy)]
    pub struct Status(pub bool);

    impl Serialize for Status {
        fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
        where
            S: Serializer,
        {
            serializer.serialize_bool(self.0)
        }
    }
}

impl JobResponse {
    pub fn success(output: JobOutput) -> Self {
        Self {
            success: boolean_or_status::Status(true),
            output: Some(output),
            error: None,
        }
    }

    pub fn failure(err: crate::error::EngineErrorDetails) -> Self {
        Self {
            success: boolean_or_status::Status(false),
            output: None,
            error: Some(err),
        }
    }
}

// 1. PDF Merge
#[derive(Debug, Clone, Deserialize)]
pub struct PdfMergeParams {
    pub input_paths: Vec<String>,
    pub output_dir: String,
    pub output_filename: Option<String>,
}

// 2. PDF Split
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PdfSplitMode {
    Burst,
    Ranges,
}

#[derive(Debug, Clone, Deserialize)]
pub struct PdfSplitParams {
    pub input_path: String,
    pub output_dir: String,
    pub mode: PdfSplitMode,
    pub ranges: Option<String>,
}

// 3. PDF Organize
#[derive(Debug, Clone, Deserialize)]
pub struct PageRotation {
    pub page_number: usize, // 1-indexed
    pub degrees: i64,       // 0, 90, 180, 270
}

#[derive(Debug, Clone, Deserialize)]
pub struct PdfOrganizeParams {
    pub input_path: String,
    pub output_dir: String,
    pub output_filename: Option<String>,
    pub rotations: Option<Vec<PageRotation>>,
    pub page_order: Option<Vec<usize>>, // 1-indexed
    pub deleted_pages: Option<Vec<usize>>, // 1-indexed
}

// 4. Images to PDF
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PageSizeChoice {
    A4,
    Letter,
    Fit,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PageOrientationChoice {
    Portrait,
    Landscape,
    Auto,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ImagesToPdfParams {
    pub input_paths: Vec<String>,
    pub output_dir: String,
    pub output_filename: Option<String>,
    pub page_size: PageSizeChoice,
    pub orientation: PageOrientationChoice,
    pub margin_mm: f64,
}

// 5. Image Studio
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ImageTargetFormat {
    Jpeg,
    Png,
    Webp,
    Preserve,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ImageResizeMode {
    None,
    Dimensions,
    Percentage,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ImageStudioParams {
    pub input_paths: Vec<String>,
    pub output_dir: String,
    pub format: ImageTargetFormat,
    pub quality: u8, // 1 - 100
    pub resize_mode: ImageResizeMode,
    pub target_width: Option<u32>,
    pub target_height: Option<u32>,
    pub scale_percentage: Option<f32>,
    pub maintain_aspect_ratio: bool,
}

// Tagged Dispatcher Requests
#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "action", content = "params")]
pub enum JobRequest {
    #[serde(rename = "pdf_merge")]
    PdfMerge(PdfMergeParams),

    #[serde(rename = "pdf_split")]
    PdfSplit(PdfSplitParams),

    #[serde(rename = "pdf_organize")]
    PdfOrganize(PdfOrganizeParams),

    #[serde(rename = "images_to_pdf")]
    ImagesToPdf(ImagesToPdfParams),

    #[serde(rename = "image_studio")]
    ImageStudio(ImageStudioParams),
}

pub fn sanitize_path(raw: &str) -> String {
    let stripped = if let Some(s) = raw.strip_prefix("file://") {
        s
    } else if let Some(s) = raw.strip_prefix("file:") {
        s
    } else {
        raw
    };

    #[cfg(windows)]
    if stripped.len() >= 3 && stripped.starts_with('/') && stripped.as_bytes()[2] == b':' {
        return stripped[1..].to_string();
    }

    stripped.to_string()
}

impl JobRequest {
    pub fn sanitize_paths(&mut self) {
        match self {
            JobRequest::PdfMerge(params) => {
                for path in &mut params.input_paths {
                    *path = sanitize_path(path);
                }
                params.output_dir = sanitize_path(&params.output_dir);
            }
            JobRequest::PdfSplit(params) => {
                params.input_path = sanitize_path(&params.input_path);
                params.output_dir = sanitize_path(&params.output_dir);
            }
            JobRequest::PdfOrganize(params) => {
                params.input_path = sanitize_path(&params.input_path);
                params.output_dir = sanitize_path(&params.output_dir);
            }
            JobRequest::ImagesToPdf(params) => {
                for path in &mut params.input_paths {
                    *path = sanitize_path(path);
                }
                params.output_dir = sanitize_path(&params.output_dir);
            }
            JobRequest::ImageStudio(params) => {
                for path in &mut params.input_paths {
                    *path = sanitize_path(path);
                }
                params.output_dir = sanitize_path(&params.output_dir);
            }
        }
    }
}

