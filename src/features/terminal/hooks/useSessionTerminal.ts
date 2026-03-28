import { listen } from '@tauri-apps/api/event';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { resizePty } from '@/features/terminal/api/resizePty';
import { spawnPty } from '@/features/terminal/api/spawnPty';
import { writePty } from '@/features/terminal/api/writePty';
import {
  exitedSessionsAtom,
  type TerminalEntry,
  terminalsAtom,
} from '@/stores/terminalStore';

type PtyOutputPayload = {
  session_id: string;
  data: number[];
};

type PtyExitPayload = {
  session_id: string;
};

export function useSessionTerminal() {
  const [terminals, setTerminals] = useAtom(terminalsAtom);
  const [exitedSessions, setExitedSessions] = useAtom(exitedSessionsAtom);

  const get = useCallback(
    (sessionId: string): TerminalEntry | undefined => {
      return terminals.get(sessionId);
    },
    [terminals],
  );

  const isExited = useCallback(
    (sessionId: string): boolean => {
      return exitedSessions.has(sessionId);
    },
    [exitedSessions],
  );

  const create = useCallback(
    async (sessionId: string, { force = false } = {}) => {
      if (!force && terminals.has(sessionId)) return;

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

      const unlistenOutput = await listen<PtyOutputPayload>(
        'pty-output',
        (event) => {
          if (event.payload.session_id === sessionId) {
            terminal.write(new Uint8Array(event.payload.data));
          }
        },
      );

      const unlistenExit = await listen<PtyExitPayload>('pty-exit', (event) => {
        if (event.payload.session_id === sessionId) {
          setExitedSessions((prev) => {
            const next = new Set(prev);
            next.add(sessionId);
            return next;
          });
        }
      });

      const unlisten = () => {
        unlistenOutput();
        unlistenExit();
      };

      setTerminals((prev) => {
        const next = new Map(prev);
        next.set(sessionId, { terminal, fitAddon, unlisten });
        return next;
      });

      await spawnPty(sessionId, terminal.cols, terminal.rows);
    },
    [terminals, setTerminals, setExitedSessions],
  );

  const restart = useCallback(
    async (sessionId: string) => {
      // 古い Terminal をクリーンアップ
      const entry = terminals.get(sessionId);
      if (entry) {
        entry.unlisten();
        entry.terminal.dispose();
      }

      setTerminals((prev) => {
        const next = new Map(prev);
        next.delete(sessionId);
        return next;
      });

      setExitedSessions((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });

      // 新しい Terminal を作成
      await create(sessionId, { force: true });
    },
    [terminals, setTerminals, setExitedSessions, create],
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

      setExitedSessions((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    },
    [terminals, setTerminals, setExitedSessions],
  );

  return { get, create, remove, restart, isExited };
}
