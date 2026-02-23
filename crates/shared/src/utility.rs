use std::io;
use std::path::PathBuf;

pub fn home_dir() -> io::Result<PathBuf> {
    dirs::home_dir()
        .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "HOME directory not found"))
}


pub fn test_dir() -> io::Result<PathBuf> {
    let dir = std::env::current_dir()?.join("tmp");
    std::fs::create_dir_all(&dir)?;
    Ok(dir)
}
