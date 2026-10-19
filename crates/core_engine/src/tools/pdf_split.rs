use lopdf::{Document, Object};
use std::path::Path;

use crate::error::EngineError;
use crate::models::{FileResult, JobOutput, PdfSplitMode, PdfSplitParams};

fn parse_ranges(ranges_str: &str, total_pages: usize) -> Result<Vec<usize>, EngineError> {
    let mut pages = Vec::new();
    let parts = ranges_str.split(',');

    for part in parts {
        let trimmed = part.trim();
        if trimmed.is_empty() {
            continue;
        }

        if let Some((start_s, end_s)) = trimmed.split_once('-') {
            let start: usize = start_s.trim().parse().map_err(|_| {
                EngineError::InvalidParameters(format!("Invalid range start: '{}'", start_s))
            })?;
            let end: usize = end_s.trim().parse().map_err(|_| {
                EngineError::InvalidParameters(format!("Invalid range end: '{}'", end_s))
            })?;

            if start > end {
                return Err(EngineError::InvalidParameters(format!(
                    "Range start {} is greater than end {}",
                    start, end
                )));
            }

            for p in start..=end {
                if p >= 1 && p <= total_pages {
                    pages.push(p);
                }
            }
        } else {
            let p: usize = trimmed.parse().map_err(|_| {
                EngineError::InvalidParameters(format!("Invalid page number: '{}'", trimmed))
            })?;
            if p >= 1 && p <= total_pages {
                pages.push(p);
            }
        }
    }

    if pages.is_empty() {
        return Err(EngineError::InvalidParameters(
            "No valid pages selected in ranges".into(),
        ));
    }

    Ok(pages)
}

fn create_sub_document(
    source_doc: &Document,
    page_numbers: &[usize],
    output_path: &Path,
) -> Result<u64, EngineError> {
    let mut target_doc = source_doc.clone();
    let pages_map = target_doc.get_pages();

    let mut selected_page_ids = Vec::new();
    for &p in page_numbers {
        if let Some(&page_id) = pages_map.get(&(p as u32)) {
            selected_page_ids.push(page_id);
        }
    }

    if selected_page_ids.is_empty() {
        return Err(EngineError::InvalidParameters(
            "None of the requested pages were found in the source PDF".into(),
        ));
    }

    // Allocate new ID for the clean Pages dictionary
    let pages_id = (target_doc.max_id + 1, 0);
    target_doc.max_id += 1;

    let kids: Vec<Object> = selected_page_ids.iter().map(|&id| Object::Reference(id)).collect();

    let mut pages_dict = lopdf::Dictionary::new();
    pages_dict.set("Type", Object::Name(b"Pages".to_vec()));
    pages_dict.set("Count", Object::Integer(selected_page_ids.len() as i64));
    pages_dict.set("Kids", Object::Array(kids));

    target_doc.objects.insert(pages_id, Object::Dictionary(pages_dict));

    // Update parent reference in selected pages
    for &page_id in &selected_page_ids {
        if let Some(Object::Dictionary(ref mut page_dict)) = target_doc.objects.get_mut(&page_id) {
            page_dict.set("Parent", Object::Reference(pages_id));
        }
    }

    // Point Catalog to our new Pages dictionary
    if let Ok(catalog_id) = target_doc.catalog() {
        let cat_id = catalog_id.get(b"Type");
        if cat_id.is_ok() {
            // Find the object id of Catalog
            let catalog_obj_id = target_doc
                .trailer
                .get(b"Root")
                .and_then(Object::as_reference)
                .map_err(|e| EngineError::PdfError(format!("Missing Root in trailer: {}", e)))?;

            if let Some(Object::Dictionary(ref mut cat_dict)) = target_doc.objects.get_mut(&catalog_obj_id) {
                cat_dict.set("Pages", Object::Reference(pages_id));
            }
        }
    }

    // Prune unused objects
    target_doc.prune_objects();

    // Ensure output directory exists
    if let Some(parent) = output_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| EngineError::IoError {
            path: parent.to_string_lossy().to_string(),
            source: e,
        })?;
    }

    target_doc.save(output_path).map_err(|e| {
        EngineError::PdfError(format!("Failed to save split PDF to '{:?}': {}", output_path, e))
    })?;

    let meta = std::fs::metadata(output_path).map_err(|e| EngineError::IoError {
        path: output_path.to_string_lossy().to_string(),
        source: e,
    })?;

    Ok(meta.len())
}

pub fn run(params: &PdfSplitParams) -> Result<JobOutput, EngineError> {
    let source_meta = std::fs::metadata(&params.input_path).map_err(|e| EngineError::IoError {
        path: params.input_path.clone(),
        source: e,
    })?;
    let original_bytes = source_meta.len();

    let doc = Document::load(&params.input_path).map_err(|e| {
        EngineError::PdfError(format!("Failed to load PDF '{}': {}", params.input_path, e))
    })?;

    let pages_map = doc.get_pages();
    let total_pages = pages_map.len();

    if total_pages == 0 {
        return Err(EngineError::PdfError("PDF contains no pages".into()));
    }

    let input_path = Path::new(&params.input_path);
    let stem = input_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("document");

    let out_dir = Path::new(&params.output_dir);

    let mut results: Vec<FileResult> = Vec::new();
    let mut total_result_bytes: u64 = 0;

    match params.mode {
        PdfSplitMode::Burst => {
            for page_num in 1..=total_pages {
                let file_name = format!("{}_page_{:03}.pdf", stem, page_num);
                let out_file = crate::fs_utils::get_unique_output_path(out_dir, &file_name);

                let res_bytes = create_sub_document(&doc, &[page_num], &out_file)?;
                total_result_bytes += res_bytes;

                results.push(FileResult {
                    input_path: params.input_path.clone(),
                    output_path: out_file.to_string_lossy().to_string(),
                    original_bytes: original_bytes / (total_pages as u64).max(1),
                    result_bytes: res_bytes,
                });
            }
        }
        PdfSplitMode::Ranges => {
            let ranges_str = params.ranges.as_deref().unwrap_or("1");
            let pages = parse_ranges(ranges_str, total_pages)?;

            let file_name = format!("{}_extracted.pdf", stem);
            let out_file = crate::fs_utils::get_unique_output_path(out_dir, &file_name);

            let res_bytes = create_sub_document(&doc, &pages, &out_file)?;
            total_result_bytes += res_bytes;

            results.push(FileResult {
                input_path: params.input_path.clone(),
                output_path: out_file.to_string_lossy().to_string(),
                original_bytes,
                result_bytes: res_bytes,
            });
        }
    }

    Ok(JobOutput {
        tool: "pdf_split".to_string(),
        files: results,
        total_original_bytes: original_bytes,
        total_result_bytes,
        message: Some(format!("Successfully split PDF into {} output file(s)", total_pages)),
    })
}
