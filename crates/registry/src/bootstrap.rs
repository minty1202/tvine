use adapter::manage::prerequisite::PrerequisiteImpl;
use kernel::manage::prerequisite::Prerequisite;

pub struct BootstrapRegistryImpl {
    prerequisite: Box<dyn Prerequisite>,
}

impl Default for BootstrapRegistryImpl {
    fn default() -> Self {
        Self::new()
    }
}

impl BootstrapRegistryImpl {
    pub fn new() -> Self {
        let prerequisite = Box::new(PrerequisiteImpl);

        Self { prerequisite }
    }
}

#[mockall::automock]
pub trait BootstrapRegistry {
    fn prerequisite(&self) -> &dyn Prerequisite;
}

impl BootstrapRegistry for BootstrapRegistryImpl {
    fn prerequisite(&self) -> &dyn Prerequisite {
        self.prerequisite.as_ref()
    }
}
