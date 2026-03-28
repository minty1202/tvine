import { listen } from '@tauri-apps/api/event';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import { useAtom } from 'jotai';
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

  const get = (sessionId: string): TerminalEntry | undefined => {
    return terminals.get(sessionId);
  };

  const isExited = (sessionId: string): boolean => {
    return exitedSessions.has(sessionId);
  };

  const cleanup = (sessionId: string) => {
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
  };

  const create = async (sessionId: string) => {
    // 既存エントリがあればクリーンアップしてから作り直す
    if (terminals.has(sessionId) && !exitedSessions.has(sessionId)) return;
    cleanup(sessionId);

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

    // spawnPty を先に呼ぶ。pty-exit リスナーはその後に登録する。
    // 前回プロセスの pty-exit イベントが IPC 経由で遅延到達する場合、
    // spawn 完了後に登録することで古いイベントを拾わない。
    setTerminals((prev) => {
      const next = new Map(prev);
      next.set(sessionId, { terminal, fitAddon, unlisten: unlistenOutput });
      return next;
    });

    await spawnPty(sessionId, terminal.cols, terminal.rows);

    const unlistenExit = await listen<PtyExitPayload>('pty-exit', (event) => {
      if (event.payload.session_id === sessionId) {
        setExitedSessions((prev) => {
          const next = new Set(prev);
          next.add(sessionId);
          return next;
        });
      }
    });

    setTerminals((prev) => {
      const next = new Map(prev);
      const entry = next.get(sessionId);
      if (entry) {
        const prevUnlisten = entry.unlisten;
        next.set(sessionId, {
          ...entry,
          unlisten: () => {
            prevUnlisten();
            unlistenExit();
          },
        });
      }
      return next;
    });
  };

  const remove = (sessionId: string) => {
    cleanup(sessionId);
  };

  return { get, create, remove, isExited };
}
