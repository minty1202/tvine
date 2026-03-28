use crate::model::session::Session;
use shared::error::AppResult;

#[mockall::automock]
pub trait SessionRepository: Send + Sync {
    fn create(&self, session: &Session) -> AppResult<()>;
}
