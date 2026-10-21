use lopdf::{Document, Object, ObjectId, Stream};
use std::path::Path;

use crate::error::EngineError;
use crate::models::{
    FileResult, ImagesToPdfParams, JobOutput, PageOrientationChoice, PageSizeChoice,
};

const MM_TO_PT: f64 = 72.0 / 25.4;

pub fn run(params: &ImagesToPdfParams) -> Result<JobOutput, EngineError> {
    if params.input_paths.is_empty() {
        return Err(EngineError::InvalidParameters(
            "At least one image must be provided".into(),
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

    let mut doc = Document::with_version("1.5");
    let mut page_object_ids: Vec<ObjectId> = Vec::new();
    let mut current_id: u32 = 1;

    for (idx, input_path) in params.input_paths.iter().enumerate() {
        // Read file bytes
        let file_bytes = std::fs::read(input_path).map_err(|e| EngineError::IoError {
            path: input_path.clone(),
            source: e,
        })?;

        // Check if raw JPEG
        let is_jpeg = file_bytes.len() >= 2 && file_bytes[0] == 0xFF && file_bytes[1] == 0xD8;

        let (img_w, img_h, is_dct, image_data) = if is_jpeg {
            // Read dimensions using image reader without full uncompressed decode
            let dyn_img = image::load_from_memory(&file_bytes).map_err(|e| {
                EngineError::ImageError(format!("Failed to parse image '{}': {}", input_path, e))
            })?;
            (dyn_img.width(), dyn_img.height(), true, file_bytes)
        } else {
            let dyn_img = image::load_from_memory(&file_bytes).map_err(|e| {
                EngineError::ImageError(format!("Failed to decode image '{}': {}", input_path, e))
            })?;
            let rgb = dyn_img.to_rgb8();
            (dyn_img.width(), dyn_img.height(), false, rgb.into_raw())
        };

        // Determine page width and height in points
        let (base_w, base_h) = match params.page_size {
            PageSizeChoice::A4 => (595.28, 841.89),
            PageSizeChoice::Letter => (612.0, 792.0),
            PageSizeChoice::Fit => {
                let margin_pt = (params.margin_mm * MM_TO_PT).max(0.0);
                (img_w as f64 + 2.0 * margin_pt, img_h as f64 + 2.0 * margin_pt)
            }
        };

        let (page_w, page_h) = match params.orientation {
            PageOrientationChoice::Portrait => (base_w.min(base_h), base_w.max(base_h)),
            PageOrientationChoice::Landscape => (base_w.max(base_h), base_w.min(base_h)),
            PageOrientationChoice::Auto => {
                if img_w > img_h {
                    (base_w.max(base_h), base_w.min(base_h))
                } else {
                    (base_w.min(base_h), base_w.max(base_h))
                }
            }
        };

        let margin_pt = (params.margin_mm * MM_TO_PT).max(0.0);
        let avail_w = (page_w - 2.0 * margin_pt).max(1.0);
        let avail_h = (page_h - 2.0 * margin_pt).max(1.0);

        let scale = (avail_w / img_w as f64).min(avail_h / img_h as f64);
        let draw_w = img_w as f64 * scale;
        let draw_h = img_h as f64 * scale;

        let x = margin_pt + (avail_w - draw_w) / 2.0;
        let y = margin_pt + (avail_h - draw_h) / 2.0;

        // Create image XObject
        let image_id = (current_id, 0);
        current_id += 1;

        let mut img_dict = lopdf::Dictionary::new();
        img_dict.set("Type", Object::Name(b"XObject".to_vec()));
        img_dict.set("Subtype", Object::Name(b"Image".to_vec()));
        img_dict.set("Width", Object::Integer(img_w as i64));
        img_dict.set("Height", Object::Integer(img_h as i64));
        img_dict.set("ColorSpace", Object::Name(b"DeviceRGB".to_vec()));
        img_dict.set("BitsPerComponent", Object::Integer(8));

        let mut stream = if is_dct {
            img_dict.set("Filter", Object::Name(b"DCTDecode".to_vec()));
            Stream::new(img_dict, image_data)
        } else {
            let mut s = Stream::new(img_dict, image_data);
            let _ = s.compress();
            s
        };
        stream.dict.set("Length", Object::Integer(stream.content.len() as i64));
        doc.objects.insert(image_id, Object::Stream(stream));

        // Create content stream drawing the image
        let content_id = (current_id, 0);
        current_id += 1;

        let im_label = format!("Im{}", idx);
        let draw_cmd = format!(
            "q\n{:.2} 0 0 {:.2} {:.2} {:.2} cm\n/{} Do\nQ\n",
            draw_w, draw_h, x, y, im_label
        );
        let mut content_stream = Stream::new(lopdf::Dictionary::new(), draw_cmd.into_bytes());
        let _ = content_stream.compress();
        content_stream.dict.set("Length", Object::Integer(content_stream.content.len() as i64));
        doc.objects.insert(content_id, Object::Stream(content_stream));

        // Create Page object
        let page_id = (current_id, 0);
        current_id += 1;
        page_object_ids.push(page_id);

        let mut xobject_dict = lopdf::Dictionary::new();
        xobject_dict.set(im_label, Object::Reference(image_id));

        let mut res_dict = lopdf::Dictionary::new();
        res_dict.set("XObject", Object::Dictionary(xobject_dict));

        let mut page_dict = lopdf::Dictionary::new();
        page_dict.set("Type", Object::Name(b"Page".to_vec()));
        page_dict.set(
            "MediaBox",
            Object::Array(vec![
                Object::Real(0.0),
                Object::Real(0.0),
                Object::Real(page_w as f32),
                Object::Real(page_h as f32),
            ]),
        );
        page_dict.set("Contents", Object::Reference(content_id));
        page_dict.set("Resources", Object::Dictionary(res_dict));

        doc.objects.insert(page_id, Object::Dictionary(page_dict));
    }

    // Build unified Pages dictionary
    let pages_id = (current_id, 0);
    current_id += 1;

    let kids: Vec<Object> = page_object_ids.iter().map(|&id| Object::Reference(id)).collect();
    let mut pages_dict = lopdf::Dictionary::new();
    pages_dict.set("Type", Object::Name(b"Pages".to_vec()));
    pages_dict.set("Count", Object::Integer(page_object_ids.len() as i64));
    pages_dict.set("Kids", Object::Array(kids));

    doc.objects.insert(pages_id, Object::Dictionary(pages_dict));

    // Update Parent in each page
    for &page_id in &page_object_ids {
        if let Some(Object::Dictionary(page_dict)) = doc.objects.get_mut(&page_id) {
            page_dict.set("Parent", Object::Reference(pages_id));
        }
    }

    // Build Catalog
    let catalog_id = (current_id, 0);
    doc.max_id = current_id;

    let mut catalog_dict = lopdf::Dictionary::new();
    catalog_dict.set("Type", Object::Name(b"Catalog".to_vec()));
    catalog_dict.set("Pages", Object::Reference(pages_id));

    doc.objects.insert(catalog_id, Object::Dictionary(catalog_dict));
    doc.trailer.set("Root", Object::Reference(catalog_id));

    // Save Output
    let output_filename = params
        .output_filename
        .clone()
        .unwrap_or_else(|| "images_document.pdf".to_string());

    let output_path = crate::fs_utils::get_unique_output_path(Path::new(&params.output_dir), &output_filename);
    if let Some(parent) = output_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| EngineError::IoError {
            path: parent.to_string_lossy().to_string(),
            source: e,
        })?;
    }

    let output_path_str = output_path.to_string_lossy().to_string();
    doc.save(&output_path).map_err(|e| {
        EngineError::PdfError(format!("Failed to save compiled PDF to '{}': {}", output_path_str, e))
    })?;

    let result_meta = std::fs::metadata(&output_path).map_err(|e| EngineError::IoError {
        path: output_path_str.clone(),
        source: e,
    })?;

    let count = page_object_ids.len();
    Ok(JobOutput {
        tool: "images_to_pdf".to_string(),
        files: vec![FileResult {
            input_path: params.input_paths.join("; "),
            output_path: output_path_str,
            original_bytes: total_original_bytes,
            result_bytes: result_meta.len(),
        }],
        total_original_bytes,
        total_result_bytes: result_meta.len(),
        message: Some(format!("Successfully converted {} image(s) into PDF with {} page(s)", params.input_paths.len(), count)),
    })
}
