use std::process::Command;

pub fn git() -> bool {
    Command::new("git").arg("--version").output().is_ok()
}

pub fn claude() -> bool {
    Command::new("claude").arg("--version").output().is_ok()
}
