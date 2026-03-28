import { invoke } from '@tauri-apps/api/core';

export function spawnPty(
  sessionId: string,
  cols: number,
  rows: number,
): Promise<void> {
  return invoke('spawn_pty', { sessionId, cols, rows });
}
