use std::path::Path;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProjectId(String);

impl From<&Path> for ProjectId {
    fn from(repository_root: &Path) -> Self {
        let path_str = repository_root.to_string_lossy();
        let trimmed = path_str.trim_start_matches('/');
        Self(trimmed.replace('/', "-"))
    }
}

impl ProjectId {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn from_path() {
        let id = ProjectId::from(Path::new("/Users/aki/dev/my-project"));
        assert_eq!(id.as_str(), "Users-aki-dev-my-project");
    }

    #[test]
    fn from_root_path() {
        let id = ProjectId::from(Path::new("/"));
        assert_eq!(id.as_str(), "");
    }
}
