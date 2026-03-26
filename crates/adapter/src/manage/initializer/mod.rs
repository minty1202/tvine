use data::manage::{ensure_root_dir, remove_root_dir};
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

    fn remove_root_dir(&self) -> std::io::Result<()> {
        remove_root_dir(&self.data)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup(name: &str) -> std::path::PathBuf {
        let test_dir = shared::utility::test_dir().unwrap().join(name);
        let _ = std::fs::remove_dir_all(&test_dir);
        std::fs::create_dir_all(&test_dir).unwrap();
        test_dir
    }

    fn cleanup(test_dir: &std::path::Path) {
        let _ = std::fs::remove_dir_all(test_dir);
    }

    // ensure_root_dir で .tvine ディレクトリが作成される
    #[test]
    fn ensure_root_dir_creates_tvine_directory() {
        let test_dir = setup("ensure");
        let ctx = AppContext::new(test_dir.clone());
        let initializer = InitializerImpl::new(ctx);

        let result = initializer.ensure_root_dir();
        assert!(result.is_ok());
        assert!(test_dir.join(".tvine").exists());

        cleanup(&test_dir);
    }

    // remove_root_dir で .tvine ディレクトリが削除される
    #[test]
    fn remove_root_dir_deletes_tvine_directory() {
        let test_dir = setup("remove");
        let ctx = AppContext::new(test_dir.clone());
        let initializer = InitializerImpl::new(ctx);

        initializer.ensure_root_dir().unwrap();
        assert!(test_dir.join(".tvine").exists());

        let result = initializer.remove_root_dir();
        assert!(result.is_ok());
        assert!(!test_dir.join(".tvine").exists());

        cleanup(&test_dir);
    }

    // remove_root_dir はディレクトリが存在しなくてもエラーにならない
    #[test]
    fn remove_root_dir_succeeds_when_not_exists() {
        let test_dir = setup("remove_not_exists");
        let ctx = AppContext::new(test_dir.clone());
        let initializer = InitializerImpl::new(ctx);

        let result = initializer.remove_root_dir();
        assert!(result.is_ok());

        cleanup(&test_dir);
    }
}
