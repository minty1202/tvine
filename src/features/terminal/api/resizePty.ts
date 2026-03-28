import { invoke } from '@tauri-apps/api/core';

export function resizePty(
  sessionId: string,
  cols: number,
  rows: number,
): Promise<void> {
  return invoke('resize_pty', { sessionId, cols, rows });
}
