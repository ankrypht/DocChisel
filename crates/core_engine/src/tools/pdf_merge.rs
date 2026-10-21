use lopdf::{Document, Object, ObjectId};
use std::path::Path;

use crate::error::EngineError;
use crate::models::{FileResult, JobOutput, PdfMergeParams};

pub fn run(params: &PdfMergeParams) -> Result<JobOutput, EngineError> {
    if params.input_paths.is_empty() {
        return Err(EngineError::InvalidParameters(
            "At least one PDF file must be provided to merge".into(),
        ));
    }

    let mut total_original_bytes: u64 = 0;
    for path in &params.input_paths {
        let meta = std::fs::metadata(path).map_err(|e| EngineError::IoError {
            path: path.clone(),
            source: e,
        })?;
        total_original_bytes += meta.len();
    }

    let mut target_doc = Document::with_version("1.5");
    let mut pages_object_ids: Vec<ObjectId> = Vec::new();

    // Track highest object id to avoid collisions when importing objects
    let mut max_id: u32 = 1;

    for input_path in &params.input_paths {
        let mut source_doc = Document::load(input_path).map_err(|e| {
            EngineError::PdfError(format!("Failed to load PDF '{}': {}", input_path, e))
        })?;

        // Renumber objects in source document starting after max_id
        source_doc.renumber_objects_with(max_id);
        max_id = source_doc.max_id + 1;

        // Collect page object IDs in order
        let pages = source_doc.get_pages();
        for (_page_num, object_id) in pages {
            pages_object_ids.push(object_id);
        }

        // Transfer all objects from source_doc to target_doc except Catalog and Pages
        for (object_id, object) in source_doc.objects {
            let is_root_or_pages = match &object {
                Object::Dictionary(dict) => {
                    if let Ok(type_name) = dict.get_type() {
                        type_name == b"Catalog" || type_name == b"Pages"
                    } else {
                        false
                    }
                }
                _ => false,
            };

            if !is_root_or_pages {
                target_doc.objects.insert(object_id, object);
            }
        }
    }

    // Allocate object IDs for Pages dictionary and Catalog dictionary
    let pages_id = (max_id, 0);
    let catalog_id = (max_id + 1, 0);
    target_doc.max_id = max_id + 1;

    // Build the /Pages dictionary
    let count = pages_object_ids.len() as i64;
    let kids: Vec<Object> = pages_object_ids.iter().map(|&id| Object::Reference(id)).collect();

    let mut pages_dict = lopdf::Dictionary::new();
    pages_dict.set("Type", Object::Name(b"Pages".to_vec()));
    pages_dict.set("Count", Object::Integer(count));
    pages_dict.set("Kids", Object::Array(kids));

    target_doc.objects.insert(pages_id, Object::Dictionary(pages_dict));

    // Update parent reference in all page objects to point to our unified /Pages
    for &page_id in &pages_object_ids {
        if let Some(Object::Dictionary(page_dict)) = target_doc.objects.get_mut(&page_id) {
            page_dict.set("Parent", Object::Reference(pages_id));
        }
    }

    // Build the /Catalog (Root) dictionary
    let mut catalog_dict = lopdf::Dictionary::new();
    catalog_dict.set("Type", Object::Name(b"Catalog".to_vec()));
    catalog_dict.set("Pages", Object::Reference(pages_id));

    target_doc.objects.insert(catalog_id, Object::Dictionary(catalog_dict));
    target_doc.trailer.set("Root", Object::Reference(catalog_id));

    // Output destination
    let output_filename = params
        .output_filename
        .clone()
        .unwrap_or_else(|| "merged_document.pdf".to_string());
    
    let output_path = crate::fs_utils::get_unique_output_path(Path::new(&params.output_dir), &output_filename);
    if let Some(parent) = output_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| EngineError::IoError {
            path: parent.to_string_lossy().to_string(),
            source: e,
        })?;
    }

    let output_path_str = output_path.to_string_lossy().to_string();
    target_doc.save(&output_path).map_err(|e| {
        EngineError::PdfError(format!("Failed to save merged PDF to '{}': {}", output_path_str, e))
    })?;

    let result_meta = std::fs::metadata(&output_path).map_err(|e| EngineError::IoError {
        path: output_path_str.clone(),
        source: e,
    })?;

    let file_result = FileResult {
        input_path: params.input_paths.join("; "),
        output_path: output_path_str,
        original_bytes: total_original_bytes,
        result_bytes: result_meta.len(),
    };

    Ok(JobOutput {
        tool: "pdf_merge".to_string(),
        files: vec![file_result],
        total_original_bytes,
        total_result_bytes: result_meta.len(),
        message: Some(format!("Successfully merged {} PDFs into {} pages", params.input_paths.len(), count)),
    })
}
