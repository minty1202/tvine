use registry::BootstrapRegistry;
use shared::error::{AppError, AppResult};

pub fn prerequisite_check(registry: &dyn BootstrapRegistry) -> AppResult<()> {
    if registry.prerequisite().check() {
        Ok(())
    } else {
        Err(AppError::PrerequisiteNotMet(
            "git および claude コマンドが必要です".to_string(),
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use kernel::prerequisite::MockPrerequisite;

    // テスト用の BootstrapRegistry 実装
    // MockBootstrapRegistry は &dyn Prerequisite の返却が難しいため、手動で用意する
    struct TestBootstrapRegistry {
        prerequisite: MockPrerequisite,
    }

    impl BootstrapRegistry for TestBootstrapRegistry {
        fn prerequisite(&self) -> &dyn kernel::prerequisite::Prerequisite {
            &self.prerequisite
        }
    }

    // 前提条件を満たしている場合は Ok を返す
    #[test]
    fn prerequisite_check_returns_ok_when_all_commands_exist() {
        let mut mock = MockPrerequisite::new();
        mock.expect_check().returning(|| true);

        let registry = TestBootstrapRegistry { prerequisite: mock };
        assert!(prerequisite_check(&registry).is_ok());
    }

    // 前提条件を満たしていない場合は PrerequisiteNotMet エラーを返す
    #[test]
    fn prerequisite_check_returns_err_when_commands_missing() {
        let mut mock = MockPrerequisite::new();
        mock.expect_check().returning(|| false);

        let registry = TestBootstrapRegistry { prerequisite: mock };
        let result = prerequisite_check(&registry);
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            AppError::PrerequisiteNotMet(_)
        ));
    }
}
