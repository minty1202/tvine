import { describe, expect, it, vi } from 'vitest';
import type { TerminalEntry } from '@/stores/terminalStore';
import { makeRemove } from './makeRemove';

vi.mock('./ptyActivityMonitor', () => ({
  activityMonitor: { cleanup: vi.fn() },
}));

import { activityMonitor } from './ptyActivityMonitor';

const mockTerminalEntry = (): TerminalEntry => {
  return {
    terminal: { dispose: vi.fn() } as unknown as TerminalEntry['terminal'],
    fitAddon: {} as unknown as TerminalEntry['fitAddon'],
    unlisten: vi.fn(),
  };
};

describe('makeRemove', () => {
  it('terminal の dispose と unlisten が呼ばれる', () => {
    const entry = mockTerminalEntry();
    const terminals = new Map<string, TerminalEntry>([['s1', entry]]);

    const remove = makeRemove({
      terminals,
      setTerminals: vi.fn(),
      setExitedSessions: vi.fn(),
      setStatusMap: vi.fn(),
    });
    remove('s1');

    expect(entry.unlisten).toHaveBeenCalledOnce();
    expect(entry.terminal.dispose).toHaveBeenCalledOnce();
  });

  it('activityMonitor の cleanup が呼ばれる', () => {
    const terminals = new Map<string, TerminalEntry>();
    const remove = makeRemove({
      terminals,
      setTerminals: vi.fn(),
      setExitedSessions: vi.fn(),
      setStatusMap: vi.fn(),
    });

    remove('s1');

    expect(activityMonitor.cleanup).toHaveBeenCalledWith('s1');
  });

  it('statusMap からエントリが削除される', () => {
    const terminals = new Map<string, TerminalEntry>();
    const setStatusMap = vi.fn();
    const remove = makeRemove({
      terminals,
      setTerminals: vi.fn(),
      setExitedSessions: vi.fn(),
      setStatusMap,
    });

    remove('s1');

    expect(setStatusMap).toHaveBeenCalledOnce();
    const updater = setStatusMap.mock.calls[0][0];
    const prev = new Map([['s1', 'Busy' as const]]);
    const result = updater(prev);
    expect(result.has('s1')).toBe(false);
  });

  it('存在しないセッションでもエラーにならない', () => {
    const terminals = new Map<string, TerminalEntry>();
    const remove = makeRemove({
      terminals,
      setTerminals: vi.fn(),
      setExitedSessions: vi.fn(),
      setStatusMap: vi.fn(),
    });

    expect(() => remove('unknown')).not.toThrow();
  });
});
