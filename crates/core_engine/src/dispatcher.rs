use crate::error::EngineError;
use crate::models::{JobOutput, JobRequest, JobResponse};
use crate::tools;

pub fn execute_job(payload_json: &str) -> String {
    let result = parse_and_run(payload_json);
    let response = match result {
        Ok(output) => JobResponse::success(output),
        Err(err) => JobResponse::failure(err.to_details()),
    };

    match serde_json::to_string(&response) {
        Ok(json) => json,
        Err(e) => {
            // Extreme fallback if serialization fails (should never happen)
            format!(
                r#"{{"success":false,"error":{{"code":"SERIALIZATION_ERROR","message":"{}"}}}}"#,
                e
            )
        }
    }
}

fn parse_and_run(payload_json: &str) -> Result<JobOutput, EngineError> {
    let mut request: JobRequest = serde_json::from_str(payload_json).map_err(EngineError::JsonError)?;
    request.sanitize_paths();

    match request {
        JobRequest::PdfMerge(params) => tools::pdf_merge::run(&params),
        JobRequest::PdfSplit(params) => tools::pdf_split::run(&params),
        JobRequest::PdfOrganize(params) => tools::pdf_organize::run(&params),
        JobRequest::ImagesToPdf(params) => tools::images_to_pdf::run(&params),
        JobRequest::ImageStudio(params) => tools::image_studio::run(&params),
    }
}
