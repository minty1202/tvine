use std::io;
use std::path::PathBuf;

pub fn home_dir() -> io::Result<PathBuf> {
    dirs::home_dir()
        .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "HOME directory not found"))
}

pub fn test_dir() -> io::Result<PathBuf> {
    let repo = git2::Repository::discover(".")
        .map_err(|e| io::Error::new(io::ErrorKind::NotFound, e.to_string()))?;
    let workspace_root = repo
        .workdir()
        .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "workspace root not found"))?;
    let dir = workspace_root.join("tmp");
    std::fs::create_dir_all(&dir)?;
    Ok(dir)
}
