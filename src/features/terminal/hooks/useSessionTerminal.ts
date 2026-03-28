import { listen } from '@tauri-apps/api/event';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { resizePty } from '@/features/terminal/api/resizePty';
import { spawnPty } from '@/features/terminal/api/spawnPty';
import { writePty } from '@/features/terminal/api/writePty';
import { type TerminalEntry, terminalsAtom } from '@/stores/terminalStore';

type PtyOutputPayload = {
  session_id: string;
  data: number[];
};

export function useSessionTerminal() {
  const [terminals, setTerminals] = useAtom(terminalsAtom);

  const get = useCallback(
    (sessionId: string): TerminalEntry | undefined => {
      return terminals.get(sessionId);
    },
    [terminals],
  );

  const create = useCallback(
    async (sessionId: string) => {
      if (terminals.has(sessionId)) return;

      const terminal = new Terminal({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: "'JetBrains Mono', monospace",
      });
      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);

      terminal.onData((data) => {
        const bytes = Array.from(new TextEncoder().encode(data));
        writePty(sessionId, bytes);
      });

      terminal.onResize(({ cols, rows }) => {
        resizePty(sessionId, cols, rows);
      });

      const unlisten = await listen<PtyOutputPayload>('pty-output', (event) => {
        if (event.payload.session_id === sessionId) {
          terminal.write(new Uint8Array(event.payload.data));
        }
      });

      setTerminals((prev) => {
        const next = new Map(prev);
        next.set(sessionId, { terminal, fitAddon, unlisten });
        return next;
      });

      await spawnPty(sessionId, terminal.cols, terminal.rows);
    },
    [terminals, setTerminals],
  );

  const remove = useCallback(
    (sessionId: string) => {
      const entry = terminals.get(sessionId);
      if (!entry) return;

      entry.unlisten();
      entry.terminal.dispose();

      setTerminals((prev) => {
        const next = new Map(prev);
        next.delete(sessionId);
        return next;
      });
    },
    [terminals, setTerminals],
  );

  return { get, create, remove };
}
