use crate::model::session::{Session, SessionId};
use shared::error::AppResult;

#[mockall::automock]
pub trait SessionRepository: Send + Sync {
    fn create(&self, session: &Session) -> AppResult<()>;
    fn get(&self, id: &SessionId) -> AppResult<Option<Session>>;
    fn list(&self) -> AppResult<Vec<Session>>;
    fn delete(&self, id: &SessionId) -> AppResult<()>;
}
