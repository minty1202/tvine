/// tvine の起動に必要な前提条件を満たしているか確認する。
/// 外部コマンド（git, claude）の存在確認など、アプリが動作するための最低限のチェックを担う。
#[mockall::automock]
pub trait Prerequisite {
    fn check(&self) -> bool;
}
