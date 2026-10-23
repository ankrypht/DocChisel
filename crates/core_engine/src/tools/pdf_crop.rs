use lopdf::{Document, Object};
use std::path::Path;

use crate::error::EngineError;
use crate::fs_utils;
use crate::models::{FileResult, JobOutput, PdfCropParams, PdfCropUnit};

const MM_TO_PT: f64 = 72.0 / 25.4;

pub fn run(params: &PdfCropParams) -> Result<JobOutput, EngineError> {
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

    let mut doc = Document::load(&params.input_path).map_err(|e| {
        EngineError::PdfError(format!("Failed to load PDF for cropping: {}", e))
    })?;

    let pages_map = doc.get_pages();
    if pages_map.is_empty() {
        return Err(EngineError::PdfError("PDF contains no pages".into()));
    }

    let unit = params.unit.clone().unwrap_or(PdfCropUnit::Pt);

    for (_page_num, page_id) in pages_map {
        let page_obj = doc.get_object_mut(page_id).map_err(EngineError::from)?;
        let page_dict = page_obj.as_dict_mut().map_err(EngineError::from)?;

        let media_box = page_dict
            .get(b"MediaBox")
            .and_then(Object::as_array)
            .map_err(|_| EngineError::PdfError("Invalid MediaBox in PDF page".into()))?
            .clone();

        if media_box.len() < 4 {
            continue;
        }

        let x0 = media_box[0].as_float().unwrap_or(0.0) as f64;
        let y0 = media_box[1].as_float().unwrap_or(0.0) as f64;
        let x1 = media_box[2].as_float().unwrap_or(595.0) as f64;
        let y1 = media_box[3].as_float().unwrap_or(842.0) as f64;

        let page_w = (x1 - x0).abs();
        let page_h = (y1 - y0).abs();

        let (left_pt, right_pt, top_pt, bottom_pt) = match unit {
            PdfCropUnit::Pt => (
                params.margin_left,
                params.margin_right,
                params.margin_top,
                params.margin_bottom,
            ),
            PdfCropUnit::Mm => (
                params.margin_left * MM_TO_PT,
                params.margin_right * MM_TO_PT,
                params.margin_top * MM_TO_PT,
                params.margin_bottom * MM_TO_PT,
            ),
            PdfCropUnit::Percentage => (
                page_w * (params.margin_left / 100.0),
                page_w * (params.margin_right / 100.0),
                page_h * (params.margin_top / 100.0),
                page_h * (params.margin_bottom / 100.0),
            ),
        };

        let mut new_x0 = x0 + left_pt;
        let mut new_y0 = y0 + bottom_pt;
        let mut new_x1 = x1 - right_pt;
        let mut new_y1 = y1 - top_pt;

        // Ensure minimum viable box of 10 points
        if new_x1 <= new_x0 + 10.0 {
            new_x0 = x0;
            new_x1 = x1;
        }
        if new_y1 <= new_y0 + 10.0 {
            new_y0 = y0;
            new_y1 = y1;
        }

        let new_box = Object::Array(vec![
            Object::Real(new_x0 as f32),
            Object::Real(new_y0 as f32),
            Object::Real(new_x1 as f32),
            Object::Real(new_y1 as f32),
        ]);

        page_dict.set("CropBox", new_box.clone());
        page_dict.set("MediaBox", new_box);
    }

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
        .unwrap_or_else(|| format!("{}_cropped.pdf", stem));

    let output_path = fs_utils::get_unique_output_path(Path::new(&params.output_dir), &filename);
    if let Some(parent) = output_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| EngineError::IoError {
            path: parent.to_string_lossy().to_string(),
            source: e,
        })?;
    }

    let output_path_str = output_path.to_string_lossy().to_string();
    doc.save(&output_path).map_err(|e| {
        EngineError::PdfError(format!("Failed to save cropped PDF: {}", e))
    })?;

    let result_bytes = std::fs::metadata(&output_path)
        .map_err(|e| EngineError::IoError {
            path: output_path_str.clone(),
            source: e,
        })?
        .len();

    Ok(JobOutput {
        tool: "pdf_crop".into(),
        files: vec![FileResult {
            input_path: params.input_path.clone(),
            output_path: output_path_str,
            original_bytes,
            result_bytes,
        }],
        total_original_bytes: original_bytes,
        total_result_bytes: result_bytes,
        message: Some("PDF margins cropped successfully.".into()),
    })
}
