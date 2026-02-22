#[mockall::automock]
pub trait Prerequisite {
    fn check(&self) -> bool;
}
