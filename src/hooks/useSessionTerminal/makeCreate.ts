import { listen } from '@tauri-apps/api/event';
import { resizePty } from '@/features/terminal/api/resizePty';
import { spawnPty } from '@/features/terminal/api/spawnPty';
import { writePty } from '@/features/terminal/api/writePty';
import type { SessionStatus } from '@/stores/statusStore';
import type { TerminalEntry } from '@/stores/terminalStore';
import { activityMonitor } from './ptyActivityMonitor';
import { setupTerminal } from './setupTerminal';

type PtyOutputPayload = {
  session_id: string;
  data: number[];
};

type PtyExitPayload = {
  session_id: string;
};

type CreateDeps = {
  terminals: Map<string, TerminalEntry>;
  exitedSessions: Set<string>;
  setTerminals: (
    fn: (prev: Map<string, TerminalEntry>) => Map<string, TerminalEntry>,
  ) => void;
  setExitedSessions: (fn: (prev: Set<string>) => Set<string>) => void;
  setStatusMap: (
    fn: (prev: Map<string, SessionStatus>) => Map<string, SessionStatus>,
  ) => void;
  cleanup: (sessionId: string) => void;
};

export const makeCreate = (deps: CreateDeps) => {
  const {
    terminals,
    exitedSessions,
    setTerminals,
    setExitedSessions,
    setStatusMap,
    cleanup,
  } = deps;

  return async (sessionId: string) => {
    if (terminals.has(sessionId) && !exitedSessions.has(sessionId)) return;
    cleanup(sessionId);

    const { terminal, fitAddon } = setupTerminal();

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

          activityMonitor.onPtyOutput(sessionId, {
            onEvaluating: () => {
              setStatusMap((prev) => {
                if (prev.get(sessionId) === 'Evaluating') return prev;
                const next = new Map(prev);
                next.set(sessionId, 'Evaluating');
                return next;
              });
            },
            onBusy: () => {
              setStatusMap((prev) => {
                if (prev.get(sessionId) === 'Busy') return prev;
                const next = new Map(prev);
                next.set(sessionId, 'Busy');
                return next;
              });
            },
            onIdle: () => {
              setStatusMap((prev) => {
                if (prev.get(sessionId) === 'Idle') return prev;
                const next = new Map(prev);
                next.set(sessionId, 'Idle');
                return next;
              });
            },
          });
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
        activityMonitor.cleanup(sessionId);
        setExitedSessions((prev) => {
          const next = new Set(prev);
          next.add(sessionId);
          return next;
        });
        setStatusMap((prev) => {
          const next = new Map(prev);
          next.set(sessionId, 'Idle');
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
};
