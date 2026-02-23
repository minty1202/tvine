use data::DataContext;
use data::manage::ensure_root_dir;
use kernel::manage::initializer::Initializer;

use derive_new::new;

#[derive(new)]
pub struct InitializerImpl {
    data: DataContext
}

impl Initializer for InitializerImpl {
    fn ensure_root_dir(&self) -> std::io::Result<()> {
        ensure_root_dir(&self.data)
    }
}
