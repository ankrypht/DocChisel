use core_engine::execute_job;
use lopdf::{Document, Object, Stream};
use serde_json::Value;
use std::path::Path;
use tempfile::TempDir;

/// Helper to construct a synthetic valid PDF with specified number of pages
fn create_test_pdf(path: &Path, page_count: usize) {
    let mut doc = Document::with_version("1.5");
    let mut page_ids = Vec::new();
    let mut current_id = 1;

    for idx in 0..page_count {
        let content_id = (current_id, 0);
        current_id += 1;

        let text = format!("BT /F1 24 Tf 100 700 Td (Page {}) Tj ET", idx + 1);
        let mut stream = Stream::new(lopdf::Dictionary::new(), text.into_bytes());
        let _ = stream.compress();
        stream.dict.set("Length", Object::Integer(stream.content.len() as i64));
        doc.objects.insert(content_id, Object::Stream(stream));

        let page_id = (current_id, 0);
        current_id += 1;
        page_ids.push(page_id);

        let mut page_dict = lopdf::Dictionary::new();
        page_dict.set("Type", Object::Name(b"Page".to_vec()));
        page_dict.set(
            "MediaBox",
            Object::Array(vec![
                Object::Real(0.0),
                Object::Real(0.0),
                Object::Real(595.0),
                Object::Real(842.0),
            ]),
        );
        page_dict.set("Contents", Object::Reference(content_id));

        doc.objects.insert(page_id, Object::Dictionary(page_dict));
    }

    let pages_id = (current_id, 0);
    current_id += 1;

    let kids: Vec<Object> = page_ids.iter().map(|&id| Object::Reference(id)).collect();
    let mut pages_dict = lopdf::Dictionary::new();
    pages_dict.set("Type", Object::Name(b"Pages".to_vec()));
    pages_dict.set("Count", Object::Integer(page_ids.len() as i64));
    pages_dict.set("Kids", Object::Array(kids));

    doc.objects.insert(pages_id, Object::Dictionary(pages_dict));

    for &page_id in &page_ids {
        if let Some(Object::Dictionary(page_dict)) = doc.objects.get_mut(&page_id) {
            page_dict.set("Parent", Object::Reference(pages_id));
        }
    }

    let catalog_id = (current_id, 0);
    doc.max_id = current_id;

    let mut catalog_dict = lopdf::Dictionary::new();
    catalog_dict.set("Type", Object::Name(b"Catalog".to_vec()));
    catalog_dict.set("Pages", Object::Reference(pages_id));

    doc.objects.insert(catalog_id, Object::Dictionary(catalog_dict));
    doc.trailer.set("Root", Object::Reference(catalog_id));

    doc.save(path).expect("Failed to save synthetic PDF");
}

/// Helper to create a test synthetic image (PNG or JPG)
fn create_test_image(path: &Path, width: u32, height: u32, format: image::ImageFormat) {
    let mut img = image::RgbImage::new(width, height);
    for (x, y, pixel) in img.enumerate_pixels_mut() {
        let r = ((x * 255) / width.max(1)) as u8;
        let g = ((y * 255) / height.max(1)) as u8;
        let b = 128;
        *pixel = image::Rgb([r, g, b]);
    }
    img.save_with_format(path, format)
        .expect("Failed to save synthetic image");
}

#[test]
fn test_pdf_merge() {
    let temp_dir = TempDir::new().unwrap();
    let pdf1_path = temp_dir.path().join("doc1.pdf");
    let pdf2_path = temp_dir.path().join("doc2.pdf");

    create_test_pdf(&pdf1_path, 2);
    create_test_pdf(&pdf2_path, 3);

    let out_dir = temp_dir.path().join("out_merge");
    let payload = serde_json::json!({
        "action": "pdf_merge",
        "params": {
            "input_paths": [pdf1_path.to_str().unwrap(), pdf2_path.to_str().unwrap()],
            "output_dir": out_dir.to_str().unwrap(),
            "output_filename": "final_merged.pdf"
        }
    });

    let resp_str = execute_job(&payload.to_string());
    let resp: Value = serde_json::from_str(&resp_str).expect("Valid JSON response");
    assert_eq!(resp["success"], true, "Job must succeed");

    let merged_file = out_dir.join("final_merged.pdf");
    assert!(merged_file.exists(), "Merged file must exist on disk");

    let loaded = Document::load(&merged_file).expect("Must load valid PDF");
    let pages = loaded.get_pages();
    assert_eq!(pages.len(), 5, "Merged PDF must contain exactly 2 + 3 = 5 pages");
}

#[test]
fn test_pdf_split_burst_and_ranges() {
    let temp_dir = TempDir::new().unwrap();
    let pdf_path = temp_dir.path().join("split_source.pdf");
    create_test_pdf(&pdf_path, 4);

    // 1. Burst mode
    let burst_out = temp_dir.path().join("out_burst");
    let payload_burst = serde_json::json!({
        "action": "pdf_split",
        "params": {
            "input_path": pdf_path.to_str().unwrap(),
            "output_dir": burst_out.to_str().unwrap(),
            "mode": "burst"
        }
    });

    let resp_burst_str = execute_job(&payload_burst.to_string());
    let resp_burst: Value = serde_json::from_str(&resp_burst_str).unwrap();
    assert_eq!(resp_burst["success"], true);

    let files = resp_burst["output"]["files"].as_array().unwrap();
    assert_eq!(files.len(), 4, "Burst mode must yield 4 files");
    for file_val in files {
        let p = file_val["output_path"].as_str().unwrap();
        assert!(Path::new(p).exists());
        let doc = Document::load(p).unwrap();
        assert_eq!(doc.get_pages().len(), 1, "Each burst file must have 1 page");
    }

    // 2. Ranges mode: "1-2, 4"
    let ranges_out = temp_dir.path().join("out_ranges");
    let payload_ranges = serde_json::json!({
        "action": "pdf_split",
        "params": {
            "input_path": pdf_path.to_str().unwrap(),
            "output_dir": ranges_out.to_str().unwrap(),
            "mode": "ranges",
            "ranges": "1-2, 4"
        }
    });

    let resp_ranges_str = execute_job(&payload_ranges.to_string());
    let resp_ranges: Value = serde_json::from_str(&resp_ranges_str).unwrap();
    assert_eq!(resp_ranges["success"], true);

    let extracted = ranges_out.join("split_source_extracted.pdf");
    assert!(extracted.exists());
    let doc_extracted = Document::load(&extracted).unwrap();
    assert_eq!(doc_extracted.get_pages().len(), 3, "Extracted pages 1, 2, 4 must total 3 pages");
}

#[test]
fn test_pdf_organize() {
    let temp_dir = TempDir::new().unwrap();
    let pdf_path = temp_dir.path().join("organize_source.pdf");
    create_test_pdf(&pdf_path, 3);

    let out_dir = temp_dir.path().join("out_organize");
    let payload = serde_json::json!({
        "action": "pdf_organize",
        "params": {
            "input_path": pdf_path.to_str().unwrap(),
            "output_dir": out_dir.to_str().unwrap(),
            "output_filename": "reorganized.pdf",
            "rotations": [
                { "page_number": 1, "degrees": 90 }
            ],
            "deleted_pages": [2],
            "page_order": [3, 1]
        }
    });

    let resp_str = execute_job(&payload.to_string());
    let resp: Value = serde_json::from_str(&resp_str).unwrap();
    assert_eq!(resp["success"], true);

    let organized_file = out_dir.join("reorganized.pdf");
    assert!(organized_file.exists());

    let doc = Document::load(&organized_file).unwrap();
    let pages = doc.get_pages();
    assert_eq!(pages.len(), 2, "After deleting page 2, exactly 2 pages must remain");

    // Check that rotation was applied
    let page2_id = pages.get(&2).unwrap();
    let page2_obj = doc.get_object(*page2_id).unwrap();
    let page2_dict = page2_obj.as_dict().unwrap();
    let rot = page2_dict.get(b"Rotate").unwrap().as_i64().unwrap();
    assert_eq!(rot, 90, "Rotated page must have /Rotate 90");
}

#[test]
fn test_images_to_pdf() {
    let temp_dir = TempDir::new().unwrap();
    let img1 = temp_dir.path().join("img1.png");
    let img2 = temp_dir.path().join("img2.jpg");
    create_test_image(&img1, 200, 200, image::ImageFormat::Png);
    create_test_image(&img2, 300, 200, image::ImageFormat::Jpeg);

    let out_dir = temp_dir.path().join("out_img2pdf");
    let payload = serde_json::json!({
        "action": "images_to_pdf",
        "params": {
            "input_paths": [img1.to_str().unwrap(), img2.to_str().unwrap()],
            "output_dir": out_dir.to_str().unwrap(),
            "output_filename": "from_images.pdf",
            "page_size": "a4",
            "orientation": "portrait",
            "margin_mm": 10.0
        }
    });

    let resp_str = execute_job(&payload.to_string());
    let resp: Value = serde_json::from_str(&resp_str).unwrap();
    assert_eq!(resp["success"], true);

    let pdf_out = out_dir.join("from_images.pdf");
    assert!(pdf_out.exists());
    let doc = Document::load(&pdf_out).unwrap();
    assert_eq!(doc.get_pages().len(), 2, "Output PDF must contain 2 pages");
}

#[test]
fn test_image_studio_compress_and_resize() {
    let temp_dir = TempDir::new().unwrap();
    let img_src = temp_dir.path().join("source.png");
    create_test_image(&img_src, 400, 200, image::ImageFormat::Png);

    let out_dir = temp_dir.path().join("out_studio");
    let payload = serde_json::json!({
        "action": "image_studio",
        "params": {
            "input_paths": [img_src.to_str().unwrap()],
            "output_dir": out_dir.to_str().unwrap(),
            "format": "webp",
            "quality": 80,
            "resize_mode": "percentage",
            "scale_percentage": 50.0,
            "maintain_aspect_ratio": true
        }
    });

    let resp_str = execute_job(&payload.to_string());
    let resp: Value = serde_json::from_str(&resp_str).unwrap();
    assert_eq!(resp["success"], true, "Error was: {:?}", resp["error"]);

    let out_webp = out_dir.join("source_processed.webp");
    assert!(out_webp.exists(), "Processed WebP file must exist");

    let loaded = image::open(&out_webp).expect("WebP file must be decodable");
    assert_eq!(loaded.width(), 200, "Width scaled 50% must be 200");
    assert_eq!(loaded.height(), 100, "Height scaled 50% must be 100");
}

#[test]
fn test_error_handling_graceful() {
    // 1. Invalid JSON
    let resp_invalid_json = execute_job("not a valid json string");
    let resp: Value = serde_json::from_str(&resp_invalid_json).unwrap();
    assert_eq!(resp["success"], false);
    assert_eq!(resp["error"]["code"], "INVALID_JSON");

    // 2. Missing input file
    let payload_missing_file = serde_json::json!({
        "action": "pdf_split",
        "params": {
            "input_path": "/nonexistent/path/to/missing_file.pdf",
            "output_dir": "/tmp",
            "mode": "burst"
        }
    });
    let resp_missing_str = execute_job(&payload_missing_file.to_string());
    let resp_missing: Value = serde_json::from_str(&resp_missing_str).unwrap();
    assert_eq!(resp_missing["success"], false);
    assert_eq!(resp_missing["error"]["code"], "IO_ERROR");
}

#[test]
fn test_non_destructive_unique_output_paths() {
    let temp_dir = TempDir::new().unwrap();
    let pdf1 = temp_dir.path().join("a.pdf");
    let pdf2 = temp_dir.path().join("b.pdf");
    create_test_pdf(&pdf1, 1);
    create_test_pdf(&pdf2, 1);

    let out_dir = temp_dir.path().join("out_test");

    let payload = serde_json::json!({
        "action": "pdf_merge",
        "params": {
            "input_paths": [pdf1.to_str().unwrap(), pdf2.to_str().unwrap()],
            "output_dir": out_dir.to_str().unwrap(),
            "output_filename": "merged.pdf"
        }
    });

    // Run 1
    let resp1: Value = serde_json::from_str(&execute_job(&payload.to_string())).unwrap();
    assert_eq!(resp1["success"], true);
    assert_eq!(
        resp1["output"]["files"][0]["output_path"].as_str().unwrap(),
        out_dir.join("merged.pdf").to_str().unwrap()
    );
    assert!(out_dir.join("merged.pdf").exists());

    // Run 2: same payload, must not overwrite merged.pdf!
    let resp2: Value = serde_json::from_str(&execute_job(&payload.to_string())).unwrap();
    assert_eq!(resp2["success"], true);
    assert_eq!(
        resp2["output"]["files"][0]["output_path"].as_str().unwrap(),
        out_dir.join("merged (1).pdf").to_str().unwrap()
    );
    assert!(out_dir.join("merged.pdf").exists(), "First file must still exist untouched");
    assert!(out_dir.join("merged (1).pdf").exists(), "Second file must exist with (1) suffix");

    // Run 3: must produce merged (2).pdf!
    let resp3: Value = serde_json::from_str(&execute_job(&payload.to_string())).unwrap();
    assert_eq!(resp3["success"], true);
    assert_eq!(
        resp3["output"]["files"][0]["output_path"].as_str().unwrap(),
        out_dir.join("merged (2).pdf").to_str().unwrap()
    );
    assert!(out_dir.join("merged (2).pdf").exists());
}

#[test]
fn test_uri_file_scheme_handling() {
    let temp_dir = TempDir::new().unwrap();
    let pdf1 = temp_dir.path().join("doc1.pdf");
    let pdf2 = temp_dir.path().join("doc2.pdf");

    create_test_pdf(&pdf1, 1);
    create_test_pdf(&pdf2, 2);

    let out_dir = temp_dir.path().join("out_uri");

    // Prepend file:// scheme as mobile frameworks like Expo/SAF provide
    let pdf1_uri = format!("file://{}", pdf1.to_str().unwrap());
    let pdf2_uri = format!("file://{}", pdf2.to_str().unwrap());
    let out_dir_uri = format!("file://{}", out_dir.to_str().unwrap());

    let payload = serde_json::json!({
        "action": "pdf_merge",
        "params": {
            "input_paths": [pdf1_uri, pdf2_uri],
            "output_dir": out_dir_uri,
            "output_filename": "uri_merged.pdf"
        }
    });

    let resp_str = execute_job(&payload.to_string());
    let resp: Value = serde_json::from_str(&resp_str).unwrap();

    assert_eq!(resp["success"], true, "Should handle file:// URI schemes without os error 2: {:?}", resp);
    assert!(out_dir.join("uri_merged.pdf").exists());
}

#[test]
fn test_pdf_compress() {
    let temp_dir = TempDir::new().unwrap();
    let img_path = temp_dir.path().join("photo.jpg");
    create_test_image(&img_path, 200, 200, image::ImageFormat::Jpeg);

    let pdf_path = temp_dir.path().join("doc_with_images.pdf");
    let out_dir = temp_dir.path().join("out_pdf_compress");

    // Create a PDF with an image via images_to_pdf
    let make_pdf_payload = serde_json::json!({
        "action": "images_to_pdf",
        "params": {
            "input_paths": [img_path.to_str().unwrap()],
            "output_dir": temp_dir.path().to_str().unwrap(),
            "output_filename": "doc_with_images.pdf",
            "page_size": "a4",
            "orientation": "portrait",
            "margin_mm": 10.0
        }
    });
    let make_resp: Value = serde_json::from_str(&execute_job(&make_pdf_payload.to_string())).unwrap();
    assert_eq!(make_resp["success"], true);

    // Compress the generated PDF
    let compress_payload = serde_json::json!({
        "action": "pdf_compress",
        "params": {
            "input_path": pdf_path.to_str().unwrap(),
            "output_dir": out_dir.to_str().unwrap(),
            "output_filename": "compressed.pdf",
            "level": "recommended"
        }
    });

    let resp: Value = serde_json::from_str(&execute_job(&compress_payload.to_string())).unwrap();
    assert_eq!(resp["success"], true, "Compress failed: {:?}", resp);
    assert!(out_dir.join("compressed.pdf").exists());
    assert_eq!(resp["output"]["tool"], "pdf_compress");
}

#[test]
fn test_pdf_watermark_text_and_image() {
    let temp_dir = TempDir::new().unwrap();
    let pdf_path = temp_dir.path().join("original.pdf");
    create_test_pdf(&pdf_path, 3);

    let logo_path = temp_dir.path().join("watermark_logo.png");
    create_test_image(&logo_path, 60, 60, image::ImageFormat::Png);

    let out_dir = temp_dir.path().join("out_watermark");

    // 1. Text Watermark
    let text_payload = serde_json::json!({
        "action": "pdf_watermark",
        "params": {
            "input_path": pdf_path.to_str().unwrap(),
            "output_dir": out_dir.to_str().unwrap(),
            "output_filename": "text_watermarked.pdf",
            "watermark_type": "text",
            "text": "DRAFT COPY",
            "font_size": 36.0,
            "color": "#FF0000",
            "opacity": 0.4,
            "rotation": 45.0,
            "position": "center",
            "pages": "1-2"
        }
    });
    let resp1: Value = serde_json::from_str(&execute_job(&text_payload.to_string())).unwrap();
    assert_eq!(resp1["success"], true, "Text watermark failed: {:?}", resp1);
    assert!(out_dir.join("text_watermarked.pdf").exists());

    // 2. Image Watermark
    let img_payload = serde_json::json!({
        "action": "pdf_watermark",
        "params": {
            "input_path": pdf_path.to_str().unwrap(),
            "output_dir": out_dir.to_str().unwrap(),
            "output_filename": "image_watermarked.pdf",
            "watermark_type": "image",
            "image_path": logo_path.to_str().unwrap(),
            "image_scale": 0.3,
            "opacity": 0.5,
            "rotation": 0.0,
            "position": "bottom_right",
            "pages": "all"
        }
    });
    let resp2: Value = serde_json::from_str(&execute_job(&img_payload.to_string())).unwrap();
    assert_eq!(resp2["success"], true, "Image watermark failed: {:?}", resp2);
    assert!(out_dir.join("image_watermarked.pdf").exists());
}

#[test]
fn test_pdf_page_numbers() {
    let temp_dir = TempDir::new().unwrap();
    let pdf_path = temp_dir.path().join("source.pdf");
    create_test_pdf(&pdf_path, 4);

    let out_dir = temp_dir.path().join("out_page_numbers");

    let payload = serde_json::json!({
        "action": "pdf_page_numbers",
        "params": {
            "input_path": pdf_path.to_str().unwrap(),
            "output_dir": out_dir.to_str().unwrap(),
            "output_filename": "numbered.pdf",
            "format_template": "Page {n} / {total}",
            "position": "bottom_center",
            "margin_pt": 30.0,
            "font_size": 12.0,
            "start_page_number": 1,
            "pages": "all"
        }
    });

    let resp: Value = serde_json::from_str(&execute_job(&payload.to_string())).unwrap();
    assert_eq!(resp["success"], true, "Page numbers failed: {:?}", resp);
    assert!(out_dir.join("numbered.pdf").exists());
}

#[test]
fn test_pdf_protect_and_unlock() {
    let temp_dir = TempDir::new().unwrap();
    let pdf_path = temp_dir.path().join("clear.pdf");
    create_test_pdf(&pdf_path, 2);

    let out_dir = temp_dir.path().join("out_crypto");

    // 1. Protect PDF with password
    let protect_payload = serde_json::json!({
        "action": "pdf_protect",
        "params": {
            "input_path": pdf_path.to_str().unwrap(),
            "output_dir": out_dir.to_str().unwrap(),
            "output_filename": "locked.pdf",
            "user_password": "DocChiselPassword123"
        }
    });
    let prot_resp: Value = serde_json::from_str(&execute_job(&protect_payload.to_string())).unwrap();
    assert_eq!(prot_resp["success"], true, "Protect failed: {:?}", prot_resp);
    let locked_path = out_dir.join("locked.pdf");
    assert!(locked_path.exists());

    // Verify it is indeed encrypted
    let doc_check = lopdf::Document::load(&locked_path);
    assert!(doc_check.is_err() || doc_check.unwrap().is_encrypted());

    // 2. Unlock PDF with wrong password should fail gracefully
    let wrong_unlock_payload = serde_json::json!({
        "action": "pdf_unlock",
        "params": {
            "input_path": locked_path.to_str().unwrap(),
            "output_dir": out_dir.to_str().unwrap(),
            "output_filename": "wrong.pdf",
            "password": "wrong_password"
        }
    });
    let wrong_resp: Value = serde_json::from_str(&execute_job(&wrong_unlock_payload.to_string())).unwrap();
    assert_eq!(wrong_resp["success"], false);

    // 3. Unlock PDF with correct password
    let unlock_payload = serde_json::json!({
        "action": "pdf_unlock",
        "params": {
            "input_path": locked_path.to_str().unwrap(),
            "output_dir": out_dir.to_str().unwrap(),
            "output_filename": "unlocked.pdf",
            "password": "DocChiselPassword123"
        }
    });
    let unl_resp: Value = serde_json::from_str(&execute_job(&unlock_payload.to_string())).unwrap();
    assert_eq!(unl_resp["success"], true, "Unlock failed: {:?}", unl_resp);
    let unlocked_path = out_dir.join("unlocked.pdf");
    assert!(unlocked_path.exists());

    // Verify unlocked document can be read without password
    let reloaded = lopdf::Document::load(&unlocked_path);
    assert!(reloaded.is_ok(), "Unlocked doc must be loadable without credentials");
    assert!(!reloaded.unwrap().is_encrypted(), "Unlocked doc must not be marked encrypted");
}

#[test]
fn test_pdf_crop() {
    let temp_dir = TempDir::new().unwrap();
    let pdf_path = temp_dir.path().join("before_crop.pdf");
    create_test_pdf(&pdf_path, 2);

    let out_dir = temp_dir.path().join("out_crop");

    let payload = serde_json::json!({
        "action": "pdf_crop",
        "params": {
            "input_path": pdf_path.to_str().unwrap(),
            "output_dir": out_dir.to_str().unwrap(),
            "output_filename": "cropped.pdf",
            "margin_top": 20.0,
            "margin_bottom": 20.0,
            "margin_left": 15.0,
            "margin_right": 15.0,
            "unit": "pt"
        }
    });

    let resp: Value = serde_json::from_str(&execute_job(&payload.to_string())).unwrap();
    assert_eq!(resp["success"], true, "Crop failed: {:?}", resp);
    assert!(out_dir.join("cropped.pdf").exists());
}

#[test]
fn test_image_watermark() {
    let temp_dir = TempDir::new().unwrap();
    let img_path = temp_dir.path().join("base_photo.jpg");
    create_test_image(&img_path, 300, 200, image::ImageFormat::Jpeg);

    let out_dir = temp_dir.path().join("out_img_watermark");

    let payload = serde_json::json!({
        "action": "image_watermark",
        "params": {
            "input_paths": [img_path.to_str().unwrap()],
            "output_dir": out_dir.to_str().unwrap(),
            "watermark_type": "text",
            "text": "DocChisel Stamp",
            "font_size": 24.0,
            "color": "#FFFFFF",
            "opacity": 0.6,
            "position": "bottom_right",
            "margin": 15
        }
    });

    let resp: Value = serde_json::from_str(&execute_job(&payload.to_string())).unwrap();
    assert_eq!(resp["success"], true, "Image watermark failed: {:?}", resp);
    assert_eq!(resp["output"]["files"].as_array().unwrap().len(), 1);
}


