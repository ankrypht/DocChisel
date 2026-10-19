use lopdf::{Document, Object};
use std::collections::HashSet;
use std::path::Path;

use crate::error::EngineError;
use crate::models::{FileResult, JobOutput, PdfOrganizeParams};

pub fn run(params: &PdfOrganizeParams) -> Result<JobOutput, EngineError> {
    let source_meta = std::fs::metadata(&params.input_path).map_err(|e| EngineError::IoError {
        path: params.input_path.clone(),
        source: e,
    })?;
    let original_bytes = source_meta.len();

    let mut doc = Document::load(&params.input_path).map_err(|e| {
        EngineError::PdfError(format!("Failed to load PDF '{}': {}", params.input_path, e))
    })?;

    let pages_map = doc.get_pages();
    let total_pages = pages_map.len();

    if total_pages == 0 {
        return Err(EngineError::PdfError("PDF contains no pages".into()));
    }

    // 1. Apply rotations
    if let Some(ref rotations) = params.rotations {
        for rot in rotations {
            if let Some(&page_id) = pages_map.get(&(rot.page_number as u32)) {
                if let Some(Object::Dictionary(ref mut page_dict)) = doc.objects.get_mut(&page_id) {
                    let current_rot = page_dict
                        .get(b"Rotate")
                        .and_then(Object::as_i64)
                        .unwrap_or(0);
                    let new_rot = (current_rot + rot.degrees).rem_euclid(360);
                    page_dict.set("Rotate", Object::Integer(new_rot));
                }
            }
        }
    }

    // 2. Determine base page order
    let initial_order: Vec<usize> = if let Some(ref custom_order) = params.page_order {
        custom_order
            .iter()
            .copied()
            .filter(|&p| p >= 1 && p <= total_pages)
            .collect()
    } else {
        (1..=total_pages).collect()
    };

    // 3. Filter out deleted pages
    let delete_set: HashSet<usize> = params
        .deleted_pages
        .as_ref()
        .map(|list| list.iter().copied().collect())
        .unwrap_or_default();

    let final_pages: Vec<usize> = initial_order
        .into_iter()
        .filter(|p| !delete_set.contains(p))
        .collect();

    if final_pages.is_empty() {
        return Err(EngineError::InvalidParameters(
            "Cannot delete all pages from the PDF document".into(),
        ));
    }

    // 4. Build new /Pages tree
    let mut selected_page_ids = Vec::new();
    for &p in &final_pages {
        if let Some(&page_id) = pages_map.get(&(p as u32)) {
            selected_page_ids.push(page_id);
        }
    }

    let pages_id = (doc.max_id + 1, 0);
    doc.max_id += 1;

    let kids: Vec<Object> = selected_page_ids.iter().map(|&id| Object::Reference(id)).collect();

    let mut pages_dict = lopdf::Dictionary::new();
    pages_dict.set("Type", Object::Name(b"Pages".to_vec()));
    pages_dict.set("Count", Object::Integer(selected_page_ids.len() as i64));
    pages_dict.set("Kids", Object::Array(kids));

    doc.objects.insert(pages_id, Object::Dictionary(pages_dict));

    // Update parent reference in selected pages
    for &page_id in &selected_page_ids {
        if let Some(Object::Dictionary(ref mut page_dict)) = doc.objects.get_mut(&page_id) {
            page_dict.set("Parent", Object::Reference(pages_id));
        }
    }

    // Update Catalog /Root to point to our new Pages dictionary
    let catalog_obj_id = doc
        .trailer
        .get(b"Root")
        .and_then(Object::as_reference)
        .map_err(|e| EngineError::PdfError(format!("Missing Root in trailer: {}", e)))?;

    if let Some(Object::Dictionary(ref mut cat_dict)) = doc.objects.get_mut(&catalog_obj_id) {
        cat_dict.set("Pages", Object::Reference(pages_id));
    }

    // Prune removed objects
    doc.prune_objects();

    // 5. Save output
    let output_filename = params
        .output_filename
        .clone()
        .unwrap_or_else(|| "organized_document.pdf".to_string());

    let output_path = crate::fs_utils::get_unique_output_path(Path::new(&params.output_dir), &output_filename);
    if let Some(parent) = output_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| EngineError::IoError {
            path: parent.to_string_lossy().to_string(),
            source: e,
        })?;
    }

    let output_path_str = output_path.to_string_lossy().to_string();
    doc.save(&output_path).map_err(|e| {
        EngineError::PdfError(format!("Failed to save organized PDF to '{}': {}", output_path_str, e))
    })?;

    let result_meta = std::fs::metadata(&output_path).map_err(|e| EngineError::IoError {
        path: output_path_str.clone(),
        source: e,
    })?;

    let count = final_pages.len();
    Ok(JobOutput {
        tool: "pdf_organize".to_string(),
        files: vec![FileResult {
            input_path: params.input_path.clone(),
            output_path: output_path_str,
            original_bytes,
            result_bytes: result_meta.len(),
        }],
        total_original_bytes: original_bytes,
        total_result_bytes: result_meta.len(),
        message: Some(format!("Successfully organized PDF into {} pages", count)),
    })
}
