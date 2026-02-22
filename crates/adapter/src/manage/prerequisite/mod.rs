use exec::exists;
use kernel::manage::prerequisite::Prerequisite;

#[derive(Default)]
pub struct PrerequisiteImpl;

impl Prerequisite for PrerequisiteImpl {
    fn check(&self) -> bool {
        exists::git() && exists::claude()
    }
}
