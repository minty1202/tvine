use kernel::prerequisite::Prerequisite;
use exec::exists;

#[derive(Default)]
pub struct PrerequisiteImpl;

impl Prerequisite for PrerequisiteImpl {
    fn check(&self) -> bool {
        exists::git() && exists::claude()
    }
}
