use crate::AppContext;
use std::io;

pub fn ensure_root_dir(ctx: &AppContext) -> io::Result<()> {
    std::fs::create_dir_all(ctx.base_path())
}
