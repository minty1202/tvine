use std::io;

pub fn ensure_root_dir() -> io::Result<()> {
    let home = dirs::home_dir()
        .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "HOME directory not found"))?;
    std::fs::create_dir_all(home.join(".tvine"))
}
