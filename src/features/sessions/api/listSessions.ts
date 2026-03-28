import { invoke } from '@tauri-apps/api/core';
import type { Session } from '@/generated/Session';

export function listSessions(): Promise<Session[]> {
  return invoke<Session[]>('list_sessions');
}
