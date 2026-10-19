use fast_image_resize::{FilterType, ResizeAlg, ResizeOptions, Resizer};
use image::DynamicImage;
use rayon::prelude::*;
use std::path::{Path, PathBuf};

use crate::error::EngineError;
use crate::models::{
    FileResult, ImageResizeMode, ImageStudioParams, ImageTargetFormat, JobOutput,
};

fn calculate_target_dimensions(
    orig_w: u32,
    orig_h: u32,
    params: &ImageStudioParams,
) -> (u32, u32) {
    match params.resize_mode {
        ImageResizeMode::None => (orig_w, orig_h),
        ImageResizeMode::Percentage => {
            let scale = params.scale_percentage.unwrap_or(100.0).max(1.0) / 100.0;
            let w = ((orig_w as f32 * scale).round() as u32).max(1);
            let h = ((orig_h as f32 * scale).round() as u32).max(1);
            (w, h)
        }
        ImageResizeMode::Dimensions => {
            let target_w = params.target_width.unwrap_or(orig_w).max(1);
            let target_h = params.target_height.unwrap_or(orig_h).max(1);

            if params.maintain_aspect_ratio {
                let scale = (target_w as f32 / orig_w as f32).min(target_h as f32 / orig_h as f32);
                let w = ((orig_w as f32 * scale).round() as u32).max(1);
                let h = ((orig_h as f32 * scale).round() as u32).max(1);
                (w, h)
            } else {
                (target_w, target_h)
            }
        }
    }
}

fn determine_target_extension(format: &ImageTargetFormat, input_path: &Path) -> &'static str {
    match format {
        ImageTargetFormat::Jpeg => "jpg",
        ImageTargetFormat::Png => "png",
        ImageTargetFormat::Webp => "webp",
        ImageTargetFormat::Preserve => {
            let ext = input_path
                .extension()
                .and_then(|s| s.to_str())
                .unwrap_or("png")
                .to_lowercase();
            match ext.as_str() {
                "jpg" | "jpeg" => "jpg",
                "webp" => "webp",
                _ => "png",
            }
        }
    }
}

fn process_single_image(
    input_path_str: &str,
    params: &ImageStudioParams,
    output_dir: &Path,
) -> Result<FileResult, EngineError> {
    let input_path = Path::new(input_path_str);
    let original_meta = std::fs::metadata(input_path).map_err(|e| EngineError::IoError {
        path: input_path_str.to_string(),
        source: e,
    })?;
    let original_bytes = original_meta.len();

    // Read and decode image
    let file_bytes = std::fs::read(input_path).map_err(|e| EngineError::IoError {
        path: input_path_str.to_string(),
        source: e,
    })?;

    let src_img = image::load_from_memory(&file_bytes).map_err(|e| {
        EngineError::ImageError(format!("Failed to decode image '{}': {}", input_path_str, e))
    })?;

    let (orig_w, orig_h) = (src_img.width(), src_img.height());
    let (target_w, target_h) = calculate_target_dimensions(orig_w, orig_h, params);

    // Normalize to RGBA8 for universal format compatibility and consistent pixel type
    let src_rgba = DynamicImage::ImageRgba8(src_img.into_rgba8());

    // Resize via fast_image_resize if dimensions changed
    let processed_img = if target_w != orig_w || target_h != orig_h {
        let mut dst_img = DynamicImage::new_rgba8(target_w, target_h);
        let mut resizer = Resizer::new();
        let options = ResizeOptions::new().resize_alg(ResizeAlg::Convolution(FilterType::Lanczos3));

        resizer
            .resize(&src_rgba, &mut dst_img, &options)
            .map_err(|e| EngineError::ImageError(format!("Lanczos3 resize failed: {:?}", e)))?;
        dst_img
    } else {
        src_rgba
    };

    let target_ext = determine_target_extension(&params.format, input_path);
    let stem = input_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("image");

    let out_filename = format!("{}_processed.{}", stem, target_ext);
    let out_path = crate::fs_utils::get_unique_output_path(output_dir, &out_filename);

    // Save with target format and quality
    match target_ext {
        "jpg" => {
            let rgb = processed_img.to_rgb8();
            let mut buf = std::io::Cursor::new(Vec::new());
            let mut encoder =
                image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buf, params.quality.clamp(1, 100));
            encoder
                .encode_image(&rgb)
                .map_err(|e| EngineError::ImageError(format!("JPEG encode error: {}", e)))?;

            std::fs::write(&out_path, buf.into_inner()).map_err(|e| EngineError::IoError {
                path: out_path.to_string_lossy().to_string(),
                source: e,
            })?;
        }
        "png" => {
            processed_img
                .save_with_format(&out_path, image::ImageFormat::Png)
                .map_err(|e| EngineError::ImageError(format!("PNG save error: {}", e)))?;
        }
        "webp" => {
            let rgba = processed_img.to_rgba8();
            let encoder = webp::Encoder::from_rgba(&rgba, target_w, target_h);
            let encoded_bytes = encoder.encode(params.quality.clamp(1, 100) as f32);

            std::fs::write(&out_path, &*encoded_bytes).map_err(|e| EngineError::IoError {
                path: out_path.to_string_lossy().to_string(),
                source: e,
            })?;
        }
        _ => {
            processed_img
                .save_with_format(&out_path, image::ImageFormat::Png)
                .map_err(|e| EngineError::ImageError(format!("Image save error: {}", e)))?;
        }
    }

    let result_meta = std::fs::metadata(&out_path).map_err(|e| EngineError::IoError {
        path: out_path.to_string_lossy().to_string(),
        source: e,
    })?;

    Ok(FileResult {
        input_path: input_path_str.to_string(),
        output_path: out_path.to_string_lossy().to_string(),
        original_bytes,
        result_bytes: result_meta.len(),
    })
}

pub fn run(params: &ImageStudioParams) -> Result<JobOutput, EngineError> {
    if params.input_paths.is_empty() {
        return Err(EngineError::InvalidParameters(
            "At least one image file must be provided".into(),
        ));
    }

    let output_dir = PathBuf::from(&params.output_dir);
    std::fs::create_dir_all(&output_dir).map_err(|e| EngineError::IoError {
        path: params.output_dir.clone(),
        source: e,
    })?;

    // Process all images in parallel across available CPU cores via Rayon
    let results: Result<Vec<FileResult>, EngineError> = params
        .input_paths
        .par_iter()
        .map(|path| process_single_image(path, params, &output_dir))
        .collect();

    let file_results = results?;
    let total_original_bytes: u64 = file_results.iter().map(|f| f.original_bytes).sum();
    let total_result_bytes: u64 = file_results.iter().map(|f| f.result_bytes).sum();

    let count = file_results.len();
    Ok(JobOutput {
        tool: "image_studio".to_string(),
        files: file_results,
        total_original_bytes,
        total_result_bytes,
        message: Some(format!("Successfully processed {} image(s)", count)),
    })
}
