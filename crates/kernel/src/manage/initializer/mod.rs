#[mockall::automock]
pub trait Initializer {
    fn ensure_root_dir(&self) -> std::io::Result<()>;
}
