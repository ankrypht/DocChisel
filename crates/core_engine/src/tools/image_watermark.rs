use ab_glyph::{FontRef, PxScale};
use image::{DynamicImage, Rgba, RgbaImage};
use rayon::prelude::*;
use std::path::Path;

use crate::error::EngineError;
use crate::fs_utils;
use crate::models::{
    FileResult, ImageWatermarkParams, JobOutput, WatermarkPosition, WatermarkType,
};

const EMBEDDED_FONT_DATA: &[u8] =
    include_bytes!("../../assets/fonts/LiberationSans-Bold.ttf");

fn parse_hex_color(hex_str: Option<&str>) -> Rgba<u8> {
    let hex = hex_str.unwrap_or("#FFFFFF").trim().trim_start_matches('#');
    if hex.len() == 6 {
        let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(255);
        let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(255);
        let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(255);
        Rgba([r, g, b, 255])
    } else {
        Rgba([255, 255, 255, 255])
    }
}

pub fn run(params: &ImageWatermarkParams) -> Result<JobOutput, EngineError> {
    if params.input_paths.is_empty() {
        return Err(EngineError::InvalidParameters(
            "At least one image path must be provided".into(),
        ));
    }

    let font = FontRef::try_from_slice(EMBEDDED_FONT_DATA).map_err(|e| {
        EngineError::ImageError(format!("Failed to load embedded font: {}", e))
    })?;

    let opacity = params.opacity.clamp(0.01, 1.0);
    let margin = params.margin.unwrap_or(20);

    // Pre-load watermark image if image type
    let watermark_image: Option<RgbaImage> = if params.watermark_type == WatermarkType::Image {
        if let Some(ref path) = params.watermark_image_path {
            let img = image::open(path).map_err(|e| {
                EngineError::ImageError(format!("Failed to open watermark logo: {}", e))
            })?;
            Some(img.to_rgba8())
        } else {
            return Err(EngineError::InvalidParameters(
                "watermark_image_path must be provided for image watermarking".into(),
            ));
        }
    } else {
        None
    };

    let text = params.text.as_deref().unwrap_or("CONFIDENTIAL");
    let text_color = parse_hex_color(params.color.as_deref());

    let results: Result<Vec<FileResult>, EngineError> = params
        .input_paths
        .par_iter()
        .map(|input_path_str| {
            let input_path = Path::new(input_path_str);
            let original_bytes = std::fs::metadata(input_path)
                .map_err(|e| EngineError::IoError {
                    path: input_path_str.clone(),
                    source: e,
                })?
                .len();

            let dyn_img = image::open(input_path).map_err(|e| {
                EngineError::ImageError(format!("Failed to open image '{}': {}", input_path_str, e))
            })?;

            let (img_w, img_h) = (dyn_img.width(), dyn_img.height());
            let mut base_rgba = dyn_img.to_rgba8();

            if let Some(ref wm) = watermark_image {
                // Calculate logo dimensions
                let scale = params.scale.unwrap_or(0.25).clamp(0.05, 1.0);
                let target_wm_w = ((img_w as f32 * scale).round() as u32).max(16);
                let target_wm_h = ((wm.height() as f32 * (target_wm_w as f32 / wm.width() as f32))
                    .round() as u32)
                    .max(16);

                let scaled_wm = image::imageops::resize(
                    wm,
                    target_wm_w,
                    target_wm_h,
                    image::imageops::FilterType::Lanczos3,
                );

                let (pos_x, pos_y) = match params.position {
                    WatermarkPosition::Center => (
                        (img_w.saturating_sub(target_wm_w)) / 2,
                        (img_h.saturating_sub(target_wm_h)) / 2,
                    ),
                    WatermarkPosition::TopLeft => (margin, margin),
                    WatermarkPosition::TopCenter => (
                        (img_w.saturating_sub(target_wm_w)) / 2,
                        margin,
                    ),
                    WatermarkPosition::TopRight => (
                        img_w.saturating_sub(target_wm_w + margin),
                        margin,
                    ),
                    WatermarkPosition::BottomLeft => (
                        margin,
                        img_h.saturating_sub(target_wm_h + margin),
                    ),
                    WatermarkPosition::BottomCenter => (
                        (img_w.saturating_sub(target_wm_w)) / 2,
                        img_h.saturating_sub(target_wm_h + margin),
                    ),
                    WatermarkPosition::BottomRight => (
                        img_w.saturating_sub(target_wm_w + margin),
                        img_h.saturating_sub(target_wm_h + margin),
                    ),
                };

                for ox in 0..target_wm_w {
                    for oy in 0..target_wm_h {
                        let tx = pos_x + ox;
                        let ty = pos_y + oy;
                        if tx < img_w && ty < img_h {
                            let wm_pixel = scaled_wm.get_pixel(ox, oy);
                            let alpha = (wm_pixel[3] as f32 / 255.0) * opacity;
                            if alpha > 0.0 {
                                let target_pixel = base_rgba.get_pixel_mut(tx, ty);
                                let inv = 1.0 - alpha;
                                target_pixel[0] = (target_pixel[0] as f32 * inv
                                    + wm_pixel[0] as f32 * alpha)
                                    .round() as u8;
                                target_pixel[1] = (target_pixel[1] as f32 * inv
                                    + wm_pixel[1] as f32 * alpha)
                                    .round() as u8;
                                target_pixel[2] = (target_pixel[2] as f32 * inv
                                    + wm_pixel[2] as f32 * alpha)
                                    .round() as u8;
                            }
                        }
                    }
                }
            } else {
                // Text Watermark
                let font_size = params
                    .font_size
                    .unwrap_or_else(|| (img_h as f32 * 0.08).clamp(16.0, 120.0));
                let scale = PxScale::from(font_size);
                let (text_w, text_h) = imageproc::drawing::text_size(scale, &font, text);

                let (pos_x, pos_y) = match params.position {
                    WatermarkPosition::Center => (
                        (img_w.saturating_sub(text_w as u32)) / 2,
                        (img_h.saturating_sub(text_h as u32)) / 2,
                    ),
                    WatermarkPosition::TopLeft => (margin, margin),
                    WatermarkPosition::TopCenter => (
                        (img_w.saturating_sub(text_w as u32)) / 2,
                        margin,
                    ),
                    WatermarkPosition::TopRight => (
                        img_w.saturating_sub(text_w as u32 + margin),
                        margin,
                    ),
                    WatermarkPosition::BottomLeft => (
                        margin,
                        img_h.saturating_sub(text_h as u32 + margin),
                    ),
                    WatermarkPosition::BottomCenter => (
                        (img_w.saturating_sub(text_w as u32)) / 2,
                        img_h.saturating_sub(text_h as u32 + margin),
                    ),
                    WatermarkPosition::BottomRight => (
                        img_w.saturating_sub(text_w as u32 + margin),
                        img_h.saturating_sub(text_h as u32 + margin),
                    ),
                };

                let mut overlay = RgbaImage::new(img_w, img_h);
                imageproc::drawing::draw_text_mut(
                    &mut overlay,
                    text_color,
                    pos_x as i32,
                    pos_y as i32,
                    scale,
                    &font,
                    text,
                );

                for (px, py, pixel) in base_rgba.enumerate_pixels_mut() {
                    let ov = overlay.get_pixel(px, py);
                    if ov[3] > 0 {
                        let alpha = (ov[3] as f32 / 255.0) * opacity;
                        let inv = 1.0 - alpha;
                        pixel[0] = (pixel[0] as f32 * inv + ov[0] as f32 * alpha).round() as u8;
                        pixel[1] = (pixel[1] as f32 * inv + ov[1] as f32 * alpha).round() as u8;
                        pixel[2] = (pixel[2] as f32 * inv + ov[2] as f32 * alpha).round() as u8;
                    }
                }
            }

            let stem = input_path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("image");
            let ext = input_path
                .extension()
                .and_then(|s| s.to_str())
                .unwrap_or("png");

            let filename = format!("{}_watermarked.{}", stem, ext);
            let output_path = fs_utils::get_unique_output_path(Path::new(&params.output_dir), &filename);
            if let Some(parent) = output_path.parent() {
                std::fs::create_dir_all(parent).map_err(|e| EngineError::IoError {
                    path: parent.to_string_lossy().to_string(),
                    source: e,
                })?;
            }

            let output_path_str = output_path.to_string_lossy().to_string();

            DynamicImage::ImageRgba8(base_rgba)
                .save(&output_path)
                .map_err(|e| {
                    EngineError::ImageError(format!(
                        "Failed to save watermarked image to '{}': {}",
                        output_path_str, e
                    ))
                })?;

            let result_bytes = std::fs::metadata(&output_path)
                .map_err(|e| EngineError::IoError {
                    path: output_path_str.clone(),
                    source: e,
                })?
                .len();

            Ok(FileResult {
                input_path: input_path_str.clone(),
                output_path: output_path_str,
                original_bytes,
                result_bytes,
            })
        })
        .collect();

    let files = results?;
    let total_orig: u64 = files.iter().map(|f| f.original_bytes).sum();
    let total_res: u64 = files.iter().map(|f| f.result_bytes).sum();

    Ok(JobOutput {
        tool: "image_watermark".into(),
        files,
        total_original_bytes: total_orig,
        total_result_bytes: total_res,
        message: Some("Watermark applied successfully.".into()),
    })
}
