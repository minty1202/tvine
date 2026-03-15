pub mod project;

use crate::AppContext;
use std::io;

pub fn ensure_root_dir(ctx: &AppContext) -> io::Result<()> {
    std::fs::create_dir_all(ctx.base_path())
}

pub fn remove_root_dir(ctx: &AppContext) -> io::Result<()> {
    let path = ctx.base_path();
    if path.exists() {
        std::fs::remove_dir_all(path)
    } else {
        Ok(())
    }
}
