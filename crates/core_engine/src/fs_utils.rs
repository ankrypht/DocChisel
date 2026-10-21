use std::path::{Path, PathBuf};

/// Given a target directory and desired file name, returns a PathBuf guaranteed not to collide
/// with any existing file on disk. If `document.pdf` already exists, returns `document (1).pdf`,
/// then `document (2).pdf`, and so on.
pub fn get_unique_output_path(output_dir: &Path, filename: &str) -> PathBuf {
    let initial_path = output_dir.join(filename);
    if !initial_path.exists() {
        return initial_path;
    }

    let p = Path::new(filename);
    let full_stem = p.file_stem().and_then(|s| s.to_str()).unwrap_or(filename);
    let ext = p.extension().and_then(|s| s.to_str());

    // Check if stem already ends with ` (N)`
    let (base_stem, start_counter) = parse_stem_counter(full_stem);

    let mut counter = start_counter;
    loop {
        let candidate_name = match ext {
            Some(e) => format!("{} ({}).{}", base_stem, counter, e),
            None => format!("{} ({})", base_stem, counter),
        };
        let candidate_path = output_dir.join(&candidate_name);
        if !candidate_path.exists() {
            return candidate_path;
        }
        counter += 1;
    }
}

fn parse_stem_counter(stem: &str) -> (&str, usize) {
    if let Some(open_paren) = stem.rfind(" (")
        && stem.ends_with(')')
    {
        let num_str = &stem[open_paren + 2..stem.len() - 1];
        if let Ok(num) = num_str.parse::<usize>() {
            return (&stem[..open_paren], num + 1);
        }
    }
    (stem, 1)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_unique_output_path() {
        let temp = TempDir::new().unwrap();
        let dir = temp.path();

        // 1. Initial file doesn't exist
        let p1 = get_unique_output_path(dir, "doc.pdf");
        assert_eq!(p1, dir.join("doc.pdf"));

        // Create doc.pdf
        std::fs::write(&p1, b"hello").unwrap();

        // 2. Next file should be doc (1).pdf
        let p2 = get_unique_output_path(dir, "doc.pdf");
        assert_eq!(p2, dir.join("doc (1).pdf"));

        // Create doc (1).pdf
        std::fs::write(&p2, b"hello").unwrap();

        // 3. Next file should be doc (2).pdf
        let p3 = get_unique_output_path(dir, "doc.pdf");
        assert_eq!(p3, dir.join("doc (2).pdf"));

        // 4. Asking directly for doc (1).pdf when it exists should yield doc (2).pdf
        let p3_alt = get_unique_output_path(dir, "doc (1).pdf");
        assert_eq!(p3_alt, dir.join("doc (2).pdf"));
    }
}
