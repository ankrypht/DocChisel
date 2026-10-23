use fast_image_resize as fr;
use lopdf::{Document, Object};
use std::path::Path;

use crate::error::EngineError;
use crate::fs_utils;
use crate::models::{FileResult, JobOutput, PdfCompressLevel, PdfCompressParams};

pub fn run(params: &PdfCompressParams) -> Result<JobOutput, EngineError> {
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

    let (quality, max_dim) = match params.level {
        PdfCompressLevel::Low => (80, 2400u32),
        PdfCompressLevel::Recommended => (65, 1600u32),
        PdfCompressLevel::Extreme => (45, 1024u32),
    };

    let mut doc = Document::load(&params.input_path).map_err(|e| {
        EngineError::PdfError(format!("Failed to load PDF for compression: {}", e))
    })?;

    // Optimize embedded image streams
    for (_id, obj) in doc.objects.iter_mut() {
        if let Object::Stream(stream) = obj {
            let is_image = stream
                .dict
                .get(b"Subtype")
                .map(|val| val == &Object::Name(b"Image".to_vec()))
                .unwrap_or(false);

            if !is_image {
                continue;
            }

            // Attempt to decode the image
            let is_dct = stream
                .dict
                .get(b"Filter")
                .map(|val| val == &Object::Name(b"DCTDecode".to_vec()))
                .unwrap_or(false);

            let decoded_img = if is_dct {
                image::load_from_memory(&stream.content).ok()
            } else {
                let _ = stream.decompress();
                image::load_from_memory(&stream.content).ok()
            };

            if let Some(dyn_img) = decoded_img {
                let (w, h) = (dyn_img.width(), dyn_img.height());
                let scale = if w > max_dim || h > max_dim {
                    let s_w = max_dim as f32 / w as f32;
                    let s_h = max_dim as f32 / h as f32;
                    s_w.min(s_h)
                } else {
                    1.0
                };

                let target_w = ((w as f32 * scale).round() as u32).max(1);
                let target_h = ((h as f32 * scale).round() as u32).max(1);

                let resized_img = if target_w != w || target_h != h {
                    let src_image = fr::images::Image::from_vec_u8(
                        w,
                        h,
                        dyn_img.to_rgb8().into_raw(),
                        fr::PixelType::U8x3,
                    )
                    .map_err(|e| {
                        EngineError::ImageError(format!("Failed to prepare image for resize: {}", e))
                    })?;

                    let mut dst_image = fr::images::Image::new(
                        target_w,
                        target_h,
                        fr::PixelType::U8x3,
                    );

                    let mut resizer = fr::Resizer::new();
                    resizer
                        .resize(&src_image, &mut dst_image, &fr::ResizeOptions::default())
                        .map_err(|e| {
                            EngineError::ImageError(format!("Fast image resize failed: {}", e))
                        })?;

                    image::RgbImage::from_raw(target_w, target_h, dst_image.into_vec())
                        .map(image::DynamicImage::ImageRgb8)
                        .unwrap_or(dyn_img)
                } else {
                    dyn_img
                };

                let mut jpeg_bytes = Vec::new();
                let mut encoder =
                    image::codecs::jpeg::JpegEncoder::new_with_quality(&mut jpeg_bytes, quality);
                let rgb = resized_img.to_rgb8();
                if encoder
                    .encode(
                        &rgb,
                        resized_img.width(),
                        resized_img.height(),
                        image::ExtendedColorType::Rgb8,
                    )
                    .is_ok()
                {
                    // Only replace if new stream is actually smaller than original
                    if jpeg_bytes.len() < stream.content.len() {
                        stream.content = jpeg_bytes;
                        stream.dict.set("Filter", Object::Name(b"DCTDecode".to_vec()));
                        stream.dict.set("Width", Object::Integer(resized_img.width() as i64));
                        stream.dict.set("Height", Object::Integer(resized_img.height() as i64));
                        stream.dict.set("ColorSpace", Object::Name(b"DeviceRGB".to_vec()));
                        stream.dict.set("BitsPerComponent", Object::Integer(8));
                        stream.dict.set("Length", Object::Integer(stream.content.len() as i64));
                        stream.dict.remove(b"DecodeParms");
                    }
                }
            }
        }
    }

    doc.prune_objects();
    doc.delete_zero_length_streams();
    let _ = doc.compress();
    doc.renumber_objects();

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
        .unwrap_or_else(|| format!("{}_compressed.pdf", stem));

    let output_path = fs_utils::get_unique_output_path(Path::new(&params.output_dir), &filename);
    if let Some(parent) = output_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| EngineError::IoError {
            path: parent.to_string_lossy().to_string(),
            source: e,
        })?;
    }

    let output_path_str = output_path.to_string_lossy().to_string();
    doc.save(&output_path).map_err(|e| {
        EngineError::PdfError(format!("Failed to save compressed PDF: {}", e))
    })?;

    let result_bytes = std::fs::metadata(&output_path)
        .map_err(|e| EngineError::IoError {
            path: output_path_str.clone(),
            source: e,
        })?
        .len();

    let saved_pct = if original_bytes > result_bytes {
        ((original_bytes - result_bytes) as f64 / original_bytes as f64) * 100.0
    } else {
        0.0
    };

    Ok(JobOutput {
        tool: "pdf_compress".into(),
        files: vec![FileResult {
            input_path: params.input_path.clone(),
            output_path: output_path_str,
            original_bytes,
            result_bytes,
        }],
        total_original_bytes: original_bytes,
        total_result_bytes: result_bytes,
        message: Some(format!(
            "Compressed successfully! Saved {:.1}% space.",
            saved_pct
        )),
    })
}
