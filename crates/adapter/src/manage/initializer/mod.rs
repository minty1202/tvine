use data::manage::ensure_root_dir;
use data::AppContext;
use kernel::manage::initializer::Initializer;

use derive_new::new;

#[derive(new)]
pub struct InitializerImpl {
    data: AppContext,
}

impl Initializer for InitializerImpl {
    fn ensure_root_dir(&self) -> std::io::Result<()> {
        ensure_root_dir(&self.data)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup() -> std::path::PathBuf {
        let test_dir = shared::utility::test_dir().unwrap();
        let _ = std::fs::remove_dir_all(&test_dir);
        test_dir
    }

    fn cleanup(test_dir: &std::path::Path) {
        let _ = std::fs::remove_dir_all(test_dir);
    }

    // ensure_root_dir で .tvine ディレクトリが実際に作成される
    #[test]
    fn ensure_root_dir_creates_tvine_directory() {
        let test_dir = setup();
        let ctx = AppContext::new(test_dir.clone());
        let initializer = InitializerImpl::new(ctx);

        let result = initializer.ensure_root_dir();
        assert!(result.is_ok());
        assert!(test_dir.join(".tvine").exists());

        cleanup(&test_dir);
    }
}
