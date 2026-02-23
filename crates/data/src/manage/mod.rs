use crate::DataContext;
use std::io;

pub fn ensure_root_dir(ctx: &DataContext) -> io::Result<()> {
    std::fs::create_dir_all(ctx.base_path())
}
