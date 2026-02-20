use std::path::Path;
use std::process::Command;

fn main() {
    let dist_dir = Path::new("../dist");
    if !dist_dir.exists() {
        let status = Command::new("pnpm")
            .args(["install", "--frozen-lockfile"])
            .current_dir("..")
            .status()
            .expect("pnpm install failed. Is pnpm installed?");
        assert!(status.success(), "pnpm install failed");

        let status = Command::new("pnpm")
            .args(["run", "build"])
            .current_dir("..")
            .status()
            .expect("pnpm build failed. Is Node.js installed?");
        assert!(status.success(), "pnpm build failed");
    }

    tauri_build::build()
}
