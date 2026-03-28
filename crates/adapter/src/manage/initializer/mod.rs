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

    // ensure_root_dir で .tvine ディレクトリが作成される
    #[test]
    fn ensure_root_dir_creates_tvine_directory() {
        let tmp = tempfile::tempdir().unwrap();
        let ctx = AppContext::new(tmp.path().to_path_buf());
        let initializer = InitializerImpl::new(ctx);

        let result = initializer.ensure_root_dir();
        assert!(result.is_ok());
        assert!(tmp.path().join(".tvine").exists());
    }

    // remove_root_dir で .tvine ディレクトリが削除される
    #[test]
    fn remove_root_dir_deletes_tvine_directory() {
        let tmp = tempfile::tempdir().unwrap();
        let ctx = AppContext::new(tmp.path().to_path_buf());
        let initializer = InitializerImpl::new(ctx);

        initializer.ensure_root_dir().unwrap();
        assert!(tmp.path().join(".tvine").exists());

        let result = initializer.remove_root_dir();
        assert!(result.is_ok());
        assert!(!tmp.path().join(".tvine").exists());
    }

    // remove_root_dir はディレクトリが存在しなくてもエラーにならない
    #[test]
    fn remove_root_dir_succeeds_when_not_exists() {
        let tmp = tempfile::tempdir().unwrap();
        let ctx = AppContext::new(tmp.path().to_path_buf());
        let initializer = InitializerImpl::new(ctx);

        let result = initializer.remove_root_dir();
        assert!(result.is_ok());
    }
}
