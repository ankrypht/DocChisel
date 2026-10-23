use lopdf::{Document, Object, Stream};
use std::collections::BTreeSet;
use std::path::Path;

use crate::error::EngineError;
use crate::fs_utils;
use crate::models::{
    FileResult, JobOutput, PageNumberPosition, PdfPageNumbersParams,
};

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

pub fn run(params: &PdfPageNumbersParams) -> Result<JobOutput, EngineError> {
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
        EngineError::PdfError(format!("Failed to load PDF for page numbers: {}", e))
    })?;

    let pages_map = doc.get_pages();
    let total_pages = pages_map.len() as u32;
    if total_pages == 0 {
        return Err(EngineError::PdfError("PDF contains no pages".into()));
    }

    let active_pages = parse_pages_filter(params.pages.as_deref(), total_pages);
    let font_size = params.font_size.clamp(6.0, 36.0);
    let margin = params.margin_pt.clamp(10.0, 150.0);

    for (page_num, page_id) in pages_map {
        if !active_pages.contains(&page_num) {
            continue;
        }

        let current_page_counter = params.start_page_number + (page_num as usize - 1);
        let text = params
            .format_template
            .replace("{n}", &current_page_counter.to_string())
            .replace("{total}", &total_pages.to_string());

        let escaped_text = escape_pdf_string(&text);
        let approx_text_width = text.len() as f64 * font_size as f64 * 0.5;

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

        let (x, y) = match params.position {
            PageNumberPosition::BottomCenter => ((page_w - approx_text_width) / 2.0, margin),
            PageNumberPosition::BottomRight => (page_w - approx_text_width - margin, margin),
            PageNumberPosition::BottomLeft => (margin, margin),
            PageNumberPosition::TopCenter => ((page_w - approx_text_width) / 2.0, page_h - margin - font_size as f64),
            PageNumberPosition::TopRight => (page_w - approx_text_width - margin, page_h - margin - font_size as f64),
            PageNumberPosition::TopLeft => (margin, page_h - margin - font_size as f64),
        };

        let overlay_commands = format!(
            "q\n0.2 0.2 0.2 rg\nBT\n/F_PN {:.2} Tf\n1 0 0 1 {:.2} {:.2} Tm\n({}) Tj\nET\nQ\n",
            font_size, x, y, escaped_text
        );

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

        let mut fonts = match resources_dict.get(b"Font") {
            Ok(Object::Dictionary(d)) => d.clone(),
            _ => lopdf::Dictionary::new(),
        };
        let mut font_dict = lopdf::Dictionary::new();
        font_dict.set("Type", Object::Name(b"Font".to_vec()));
        font_dict.set("Subtype", Object::Name(b"Type1".to_vec()));
        font_dict.set("BaseFont", Object::Name(b"Helvetica".to_vec()));
        fonts.set("F_PN", Object::Dictionary(font_dict));
        resources_dict.set("Font", Object::Dictionary(fonts));
        page_dict.set("Resources", Object::Dictionary(resources_dict));

        // Append to Contents
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
        .unwrap_or_else(|| format!("{}_numbered.pdf", stem));

    let output_path = fs_utils::get_unique_output_path(Path::new(&params.output_dir), &filename);
    if let Some(parent) = output_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| EngineError::IoError {
            path: parent.to_string_lossy().to_string(),
            source: e,
        })?;
    }

    let output_path_str = output_path.to_string_lossy().to_string();
    doc.save(&output_path).map_err(|e| {
        EngineError::PdfError(format!("Failed to save numbered PDF: {}", e))
    })?;

    let result_bytes = std::fs::metadata(&output_path)
        .map_err(|e| EngineError::IoError {
            path: output_path_str.clone(),
            source: e,
        })?
        .len();

    Ok(JobOutput {
        tool: "pdf_page_numbers".into(),
        files: vec![FileResult {
            input_path: params.input_path.clone(),
            output_path: output_path_str,
            original_bytes,
            result_bytes,
        }],
        total_original_bytes: original_bytes,
        total_result_bytes: result_bytes,
        message: Some(format!("Numbered {} page(s) successfully.", active_pages.len())),
    })
}
