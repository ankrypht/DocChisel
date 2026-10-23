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

// 4. PDF Compress (Batch 1)
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PdfCompressLevel {
    Extreme,
    Recommended,
    Low,
}

#[derive(Debug, Clone, Deserialize)]
pub struct PdfCompressParams {
    pub input_path: String,
    pub output_dir: String,
    pub output_filename: Option<String>,
    pub level: PdfCompressLevel,
}

// 5. PDF Watermark (Batch 1)
#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum WatermarkType {
    Text,
    Image,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WatermarkPosition {
    Center,
    TopLeft,
    TopCenter,
    TopRight,
    BottomLeft,
    BottomCenter,
    BottomRight,
}

#[derive(Debug, Clone, Deserialize)]
pub struct PdfWatermarkParams {
    pub input_path: String,
    pub output_dir: String,
    pub output_filename: Option<String>,
    pub watermark_type: WatermarkType,
    pub text: Option<String>,
    pub font_size: Option<f32>,
    pub color: Option<String>,
    pub image_path: Option<String>,
    pub image_scale: Option<f32>,
    pub opacity: f32,
    pub rotation: f32,
    pub position: WatermarkPosition,
    pub pages: Option<String>,
}

// 6. PDF Page Numbers (Batch 1)
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PageNumberPosition {
    BottomCenter,
    BottomRight,
    BottomLeft,
    TopCenter,
    TopRight,
    TopLeft,
}

#[derive(Debug, Clone, Deserialize)]
pub struct PdfPageNumbersParams {
    pub input_path: String,
    pub output_dir: String,
    pub output_filename: Option<String>,
    pub format_template: String,
    pub position: PageNumberPosition,
    pub margin_pt: f64,
    pub font_size: f32,
    pub start_page_number: usize,
    pub pages: Option<String>,
}

// 7. PDF Protect (Batch 1)
#[derive(Debug, Clone, Deserialize)]
pub struct PdfProtectParams {
    pub input_path: String,
    pub output_dir: String,
    pub output_filename: Option<String>,
    pub user_password: String,
    pub owner_password: Option<String>,
}

// 8. PDF Unlock (Batch 1)
#[derive(Debug, Clone, Deserialize)]
pub struct PdfUnlockParams {
    pub input_path: String,
    pub output_dir: String,
    pub output_filename: Option<String>,
    pub password: String,
}

// 9. PDF Crop (Batch 1)
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PdfCropUnit {
    Pt,
    Mm,
    Percentage,
}

#[derive(Debug, Clone, Deserialize)]
pub struct PdfCropParams {
    pub input_path: String,
    pub output_dir: String,
    pub output_filename: Option<String>,
    pub margin_top: f64,
    pub margin_bottom: f64,
    pub margin_left: f64,
    pub margin_right: f64,
    pub unit: Option<PdfCropUnit>,
}

// 10. Images to PDF
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

// 11. Image Studio
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

// 12. Image Watermark (Batch 1)
#[derive(Debug, Clone, Deserialize)]
pub struct ImageWatermarkParams {
    pub input_paths: Vec<String>,
    pub output_dir: String,
    pub watermark_type: WatermarkType,
    pub text: Option<String>,
    pub font_size: Option<f32>,
    pub color: Option<String>,
    pub watermark_image_path: Option<String>,
    pub scale: Option<f32>,
    pub opacity: f32,
    pub position: WatermarkPosition,
    pub margin: Option<u32>,
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

    #[serde(rename = "pdf_compress")]
    PdfCompress(PdfCompressParams),

    #[serde(rename = "pdf_watermark")]
    PdfWatermark(PdfWatermarkParams),

    #[serde(rename = "pdf_page_numbers")]
    PdfPageNumbers(PdfPageNumbersParams),

    #[serde(rename = "pdf_protect")]
    PdfProtect(PdfProtectParams),

    #[serde(rename = "pdf_unlock")]
    PdfUnlock(PdfUnlockParams),

    #[serde(rename = "pdf_crop")]
    PdfCrop(PdfCropParams),

    #[serde(rename = "images_to_pdf")]
    ImagesToPdf(ImagesToPdfParams),

    #[serde(rename = "image_studio")]
    ImageStudio(ImageStudioParams),

    #[serde(rename = "image_watermark")]
    ImageWatermark(ImageWatermarkParams),
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
            JobRequest::PdfCompress(params) => {
                params.input_path = sanitize_path(&params.input_path);
                params.output_dir = sanitize_path(&params.output_dir);
            }
            JobRequest::PdfWatermark(params) => {
                params.input_path = sanitize_path(&params.input_path);
                params.output_dir = sanitize_path(&params.output_dir);
                if let Some(ref mut ip) = params.image_path {
                    *ip = sanitize_path(ip);
                }
            }
            JobRequest::PdfPageNumbers(params) => {
                params.input_path = sanitize_path(&params.input_path);
                params.output_dir = sanitize_path(&params.output_dir);
            }
            JobRequest::PdfProtect(params) => {
                params.input_path = sanitize_path(&params.input_path);
                params.output_dir = sanitize_path(&params.output_dir);
            }
            JobRequest::PdfUnlock(params) => {
                params.input_path = sanitize_path(&params.input_path);
                params.output_dir = sanitize_path(&params.output_dir);
            }
            JobRequest::PdfCrop(params) => {
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
            JobRequest::ImageWatermark(params) => {
                for path in &mut params.input_paths {
                    *path = sanitize_path(path);
                }
                params.output_dir = sanitize_path(&params.output_dir);
                if let Some(ref mut wp) = params.watermark_image_path {
                    *wp = sanitize_path(wp);
                }
            }
        }
    }
}
