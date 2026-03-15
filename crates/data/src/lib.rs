use std::path::{Path, PathBuf};

pub mod manage;

const APP_DIR_NAME: &str = ".tvine";

#[derive(Debug)]
pub struct AppContext {
    base_path: PathBuf,
}

impl AppContext {
    pub fn new(home_dir: PathBuf) -> Self {
        let base_path = home_dir.join(APP_DIR_NAME);
        Self { base_path }
    }

    pub fn base_path(&self) -> &Path {
        &self.base_path
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn app_context_base_path_appends_tvine() {
        let ctx = AppContext::new(PathBuf::from("/home/user"));
        assert_eq!(ctx.base_path(), Path::new("/home/user/.tvine"));
    }
}
