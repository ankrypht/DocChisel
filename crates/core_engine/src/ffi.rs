use std::ffi::{CStr, CString};
use std::os::raw::c_char;

use crate::dispatcher::execute_job;

/// C-ABI single entry point for mobile FFI (iOS / Android / Flutter)
///
/// # Safety
/// Dereferences `payload_ptr` which must be a valid, null-terminated C string or null.
#[no_mangle]
pub unsafe extern "C" fn docchisel_execute_job(payload_ptr: *const c_char) -> *mut c_char {
    if payload_ptr.is_null() {
        let err_json = r#"{"success":false,"error":{"code":"NULL_POINTER","message":"Payload pointer was null"}}"#;
        return CString::new(err_json).unwrap_or_default().into_raw();
    }

    let c_str = CStr::from_ptr(payload_ptr);
    let payload_str = match c_str.to_str() {
        Ok(s) => s,
        Err(_) => {
            let err_json = r#"{"success":false,"error":{"code":"INVALID_UTF8","message":"Payload was not valid UTF-8"}}"#;
            return CString::new(err_json).unwrap_or_default().into_raw();
        }
    };

    let response_json = execute_job(payload_str);
    CString::new(response_json).unwrap_or_default().into_raw()
}

/// Free a string previously allocated and returned by `docchisel_execute_job`
///
/// # Safety
/// `ptr` must be a pointer allocated by `docchisel_execute_job` (via `CString::into_raw`) or null.
#[no_mangle]
pub unsafe extern "C" fn docchisel_free_string(ptr: *mut c_char) {
    if !ptr.is_null() {
        let _ = CString::from_raw(ptr);
    }
}
