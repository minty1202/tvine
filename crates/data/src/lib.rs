use std::path::{Path, PathBuf};

pub mod manage;

#[derive(Debug)]
pub struct DataContext {
    base_path: PathBuf,
}

impl DataContext {
    pub fn new(home_dir: PathBuf) -> Self {
        let base_path = home_dir.join(".tvine");
        Self { base_path }
    }

    pub fn base_path(&self) -> &Path {
        &self.base_path
    }
}
