import type { TerminalEntry } from '@/stores/terminalStore';
import { activityMonitor } from './ptyActivityMonitor';

type RemoveDeps = {
  terminals: Map<string, TerminalEntry>;
  setTerminals: (
    fn: (prev: Map<string, TerminalEntry>) => Map<string, TerminalEntry>,
  ) => void;
  setExitedSessions: (fn: (prev: Set<string>) => Set<string>) => void;
};

export function makeRemove(deps: RemoveDeps) {
  const { terminals, setTerminals, setExitedSessions } = deps;

  return (sessionId: string) => {
    activityMonitor.cleanup(sessionId);

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
}
