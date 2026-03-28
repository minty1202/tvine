import { invoke } from '@tauri-apps/api/core';

export function deleteSession(sessionId: string): Promise<void> {
  return invoke('delete_session', { sessionId });
}
