use adapter::manage::{initializer::InitializerImpl, prerequisite::PrerequisiteImpl};
use data::AppContext;
use kernel::manage::{initializer::Initializer, prerequisite::Prerequisite};

pub struct BootstrapRegistryImpl {
    initializer: Box<dyn Initializer>,
    prerequisite: Box<dyn Prerequisite>,
}

impl BootstrapRegistryImpl {
    pub fn new(data: AppContext) -> Self {
        let initializer = Box::new(InitializerImpl::new(data));
        let prerequisite = Box::new(PrerequisiteImpl);

        Self {
            initializer,
            prerequisite,
        }
    }
}

#[mockall::automock]
pub trait BootstrapRegistry {
    fn initializer(&self) -> &dyn Initializer;
    fn prerequisite(&self) -> &dyn Prerequisite;
}

impl BootstrapRegistry for BootstrapRegistryImpl {
    fn initializer(&self) -> &dyn Initializer {
        self.initializer.as_ref()
    }

    fn prerequisite(&self) -> &dyn Prerequisite {
        self.prerequisite.as_ref()
    }
}
