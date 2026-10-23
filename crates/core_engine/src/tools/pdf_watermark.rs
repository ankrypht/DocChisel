use lopdf::{Document, Object, Stream};
use std::collections::BTreeSet;
use std::path::Path;

use crate::error::EngineError;
use crate::fs_utils;
use crate::models::{
    FileResult, JobOutput, PdfWatermarkParams, WatermarkPosition, WatermarkType,
};

fn parse_hex_color(hex_str: Option<&str>) -> (f32, f32, f32) {
    let hex = hex_str.unwrap_or("#555555").trim().trim_start_matches('#');
    if hex.len() == 6 {
        let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(85) as f32 / 255.0;
        let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(85) as f32 / 255.0;
        let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(85) as f32 / 255.0;
        (r, g, b)
    } else {
        (0.33, 0.33, 0.33)
    }
}

fn parse_pages_filter(filter: Option<&str>, total_pages: u32) -> BTreeSet<u32> {
    let mut selected = BTreeSet::new();
    let filter = filter.unwrap_or("all").trim();

    if filter.is_empty() || filter.eq_ignore_ascii_case("all") {
        for p in 1..=total_pages {
            selected.insert(p);
        }
        return selected;
    }

    for part in filter.split(',') {
        let part = part.trim();
        if let Some((start_s, end_s)) = part.split_once('-') {
            if let (Ok(s), Ok(e)) = (start_s.trim().parse::<u32>(), end_s.trim().parse::<u32>())
            {
                for p in s..=e.min(total_pages) {
                    if p >= 1 {
                        selected.insert(p);
                    }
                }
            }
        } else if let Ok(p) = part.parse::<u32>() {
            if p >= 1 && p <= total_pages {
                selected.insert(p);
            }
        }
    }

    if selected.is_empty() {
        for p in 1..=total_pages {
            selected.insert(p);
        }
    }

    selected
}

fn escape_pdf_string(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 4);
    for c in s.chars() {
        match c {
            '\\' => out.push_str("\\\\"),
            '(' => out.push_str("\\("),
            ')' => out.push_str("\\)"),
            '\r' => out.push_str("\\r"),
            '\n' => out.push_str("\\n"),
            _ => out.push(c),
        }
    }
    out
}

pub fn run(params: &PdfWatermarkParams) -> Result<JobOutput, EngineError> {
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
        EngineError::PdfError(format!("Failed to load PDF for watermarking: {}", e))
    })?;

    let pages_map = doc.get_pages();
    let total_pages = pages_map.len() as u32;
    if total_pages == 0 {
        return Err(EngineError::PdfError("PDF contains no pages".into()));
    }

    let active_pages = parse_pages_filter(params.pages.as_deref(), total_pages);
    let opacity = params.opacity.clamp(0.01, 1.0);
    let (r, g, b) = parse_hex_color(params.color.as_deref());

    // Prepare image XObject if watermark_type is Image
    let image_xobject_id = if params.watermark_type == WatermarkType::Image {
        if let Some(ref img_path) = params.image_path {
            let img_bytes = std::fs::read(img_path).map_err(|e| EngineError::IoError {
                path: img_path.clone(),
                source: e,
            })?;
            let dyn_img = image::load_from_memory(&img_bytes).map_err(|e| {
                EngineError::ImageError(format!("Failed to parse watermark image: {}", e))
            })?;

            let img_w = dyn_img.width();
            let img_h = dyn_img.height();
            let rgb = dyn_img.to_rgb8();

            let mut img_dict = lopdf::Dictionary::new();
            img_dict.set("Type", Object::Name(b"XObject".to_vec()));
            img_dict.set("Subtype", Object::Name(b"Image".to_vec()));
            img_dict.set("Width", Object::Integer(img_w as i64));
            img_dict.set("Height", Object::Integer(img_h as i64));
            img_dict.set("ColorSpace", Object::Name(b"DeviceRGB".to_vec()));
            img_dict.set("BitsPerComponent", Object::Integer(8));

            let mut stream = Stream::new(img_dict, rgb.into_raw());
            let _ = stream.compress();
            stream.dict.set("Length", Object::Integer(stream.content.len() as i64));

            Some((doc.add_object(stream), img_w as f64, img_h as f64))
        } else {
            return Err(EngineError::InvalidParameters(
                "Watermark image path must be provided for image watermarking".into(),
            ));
        }
    } else {
        None
    };

    let text_content = params.text.as_deref().unwrap_or("CONFIDENTIAL");
    let escaped_text = escape_pdf_string(text_content);
    let font_size = params.font_size.unwrap_or(48.0).max(8.0);
    let rad = params.rotation.to_radians();
    let cos = rad.cos();
    let sin = rad.sin();

    for (page_num, page_id) in pages_map {
        if !active_pages.contains(&page_num) {
            continue;
        }

        let (page_w, page_h) = {
            let page_obj = doc.get_object(page_id).map_err(EngineError::from)?;
            let page_dict = page_obj.as_dict().map_err(EngineError::from)?;
            let media_box = page_dict
                .get(b"MediaBox")
                .and_then(Object::as_array)
                .map_err(|_| EngineError::PdfError("Invalid MediaBox in PDF page".into()))?;

            let w = if media_box.len() >= 4 {
                let x0 = media_box[0].as_float().unwrap_or(0.0);
                let x1 = media_box[2].as_float().unwrap_or(595.0);
                (x1 - x0).abs() as f64
            } else {
                595.0
            };

            let h = if media_box.len() >= 4 {
                let y0 = media_box[1].as_float().unwrap_or(0.0);
                let y1 = media_box[3].as_float().unwrap_or(842.0);
                (y1 - y0).abs() as f64
            } else {
                842.0
            };

            (w, h)
        };

        let (pos_x, pos_y) = match params.position {
            WatermarkPosition::Center => (page_w / 2.0, page_h / 2.0),
            WatermarkPosition::TopLeft => (page_w * 0.25, page_h * 0.75),
            WatermarkPosition::TopCenter => (page_w / 2.0, page_h * 0.8),
            WatermarkPosition::TopRight => (page_w * 0.75, page_h * 0.75),
            WatermarkPosition::BottomLeft => (page_w * 0.25, page_h * 0.25),
            WatermarkPosition::BottomCenter => (page_w / 2.0, page_h * 0.2),
            WatermarkPosition::BottomRight => (page_w * 0.75, page_h * 0.25),
        };

        // Construct graphics stream
        let overlay_commands = if let Some((_img_obj_id, img_w, img_h)) = image_xobject_id {
            let scale = params.image_scale.unwrap_or(0.5) as f64;
            let draw_w = (img_w * scale).min(page_w * 0.8);
            let draw_h = (img_h * scale).min(page_h * 0.8);
            let draw_x = pos_x - draw_w / 2.0;
            let draw_y = pos_y - draw_h / 2.0;

            format!(
                "q\n/GS_WM gs\n{:.2} 0 0 {:.2} {:.2} {:.2} cm\n/Im_WM Do\nQ\n",
                draw_w, draw_h, draw_x, draw_y
            )
        } else {
            let approx_text_w = (text_content.len() as f64 * font_size as f64 * 0.45) / 2.0;
            let draw_x = pos_x - (approx_text_w * cos as f64);
            let draw_y = pos_y - (approx_text_w * sin as f64);

            format!(
                "q\n/GS_WM gs\n{:.3} {:.3} {:.3} rg\nBT\n/F_WM {:.2} Tf\n{:.4} {:.4} {:.4} {:.4} {:.2} {:.2} Tm\n({}) Tj\nET\nQ\n",
                r, g, b, font_size, cos, sin, -sin, cos, draw_x, draw_y, escaped_text
            )
        };

        let mut overlay_stream = Stream::new(lopdf::Dictionary::new(), overlay_commands.into_bytes());
        let _ = overlay_stream.compress();
        overlay_stream
            .dict
            .set("Length", Object::Integer(overlay_stream.content.len() as i64));
        let overlay_id = doc.add_object(overlay_stream);

        // Update page Resources and Contents
        let page_obj = doc.get_object_mut(page_id).map_err(EngineError::from)?;
        let page_dict = page_obj.as_dict_mut().map_err(EngineError::from)?;

        let mut resources_dict = match page_dict.get(b"Resources") {
            Ok(Object::Dictionary(d)) => d.clone(),
            _ => lopdf::Dictionary::new(),
        };

        // ExtGState for opacity
        let mut ext_gstate = match resources_dict.get(b"ExtGState") {
            Ok(Object::Dictionary(d)) => d.clone(),
            _ => lopdf::Dictionary::new(),
        };
        let mut gs_dict = lopdf::Dictionary::new();
        gs_dict.set("Type", Object::Name(b"ExtGState".to_vec()));
        gs_dict.set("ca", Object::Real(opacity));
        gs_dict.set("CA", Object::Real(opacity));
        ext_gstate.set("GS_WM", Object::Dictionary(gs_dict));
        resources_dict.set("ExtGState", Object::Dictionary(ext_gstate));

        // Font or XObject resources
        if let Some((img_obj_id, _, _)) = image_xobject_id {
            let mut xobjects = match resources_dict.get(b"XObject") {
                Ok(Object::Dictionary(d)) => d.clone(),
                _ => lopdf::Dictionary::new(),
            };
            xobjects.set("Im_WM", Object::Reference(img_obj_id));
            resources_dict.set("XObject", Object::Dictionary(xobjects));
        } else {
            let mut fonts = match resources_dict.get(b"Font") {
                Ok(Object::Dictionary(d)) => d.clone(),
                _ => lopdf::Dictionary::new(),
            };
            let mut font_dict = lopdf::Dictionary::new();
            font_dict.set("Type", Object::Name(b"Font".to_vec()));
            font_dict.set("Subtype", Object::Name(b"Type1".to_vec()));
            font_dict.set("BaseFont", Object::Name(b"Helvetica-Bold".to_vec()));
            fonts.set("F_WM", Object::Dictionary(font_dict));
            resources_dict.set("Font", Object::Dictionary(fonts));
        }

        page_dict.set("Resources", Object::Dictionary(resources_dict));

        // Append overlay stream to Contents
        match page_dict.get_mut(b"Contents") {
            Ok(Object::Array(arr)) => {
                arr.push(Object::Reference(overlay_id));
            }
            Ok(Object::Reference(existing_id)) => {
                let prev = Object::Reference(*existing_id);
                page_dict.set("Contents", Object::Array(vec![prev, Object::Reference(overlay_id)]));
            }
            _ => {
                page_dict.set("Contents", Object::Reference(overlay_id));
            }
        }
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
        .unwrap_or_else(|| format!("{}_watermarked.pdf", stem));

    let output_path = fs_utils::get_unique_output_path(Path::new(&params.output_dir), &filename);
    if let Some(parent) = output_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| EngineError::IoError {
            path: parent.to_string_lossy().to_string(),
            source: e,
        })?;
    }

    let output_path_str = output_path.to_string_lossy().to_string();
    doc.save(&output_path).map_err(|e| {
        EngineError::PdfError(format!("Failed to save watermarked PDF: {}", e))
    })?;

    let result_bytes = std::fs::metadata(&output_path)
        .map_err(|e| EngineError::IoError {
            path: output_path_str.clone(),
            source: e,
        })?
        .len();

    Ok(JobOutput {
        tool: "pdf_watermark".into(),
        files: vec![FileResult {
            input_path: params.input_path.clone(),
            output_path: output_path_str,
            original_bytes,
            result_bytes,
        }],
        total_original_bytes: original_bytes,
        total_result_bytes: result_bytes,
        message: Some(format!("Watermark applied across {} page(s).", active_pages.len())),
    })
}
