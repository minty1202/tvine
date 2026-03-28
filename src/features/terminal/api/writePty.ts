import { invoke } from '@tauri-apps/api/core';

export function writePty(sessionId: string, data: number[]): Promise<void> {
  return invoke('write_pty', { sessionId, data });
}
