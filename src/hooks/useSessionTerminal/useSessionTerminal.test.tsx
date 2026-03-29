import { act, renderHook } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exitedSessionsAtom } from '@/stores/terminalStore';
import { useSessionTerminal } from './useSessionTerminal';

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(async () => vi.fn()),
}));

vi.mock('@/features/terminal/api/spawnPty', () => ({
  spawnPty: vi.fn(),
}));

vi.mock('@/features/terminal/api/writePty', () => ({
  writePty: vi.fn(),
}));

vi.mock('@/features/terminal/api/resizePty', () => ({
  resizePty: vi.fn(),
}));

vi.mock('./setupTerminal', () => ({
  setupTerminal: () => ({
    terminal: {
      write: vi.fn(),
      onData: vi.fn(),
      onResize: vi.fn(),
      dispose: vi.fn(),
      cols: 80,
      rows: 24,
    },
    fitAddon: {},
  }),
}));

vi.mock('./ptyActivityMonitor', () => ({
  activityMonitor: { onPtyOutput: vi.fn(), cleanup: vi.fn() },
}));

let store: ReturnType<typeof createStore>;

function wrapper({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

beforeEach(() => {
  store = createStore();
});

describe('useSessionTerminal', () => {
  describe('get', () => {
    it('create したセッションの TerminalEntry を返す', async () => {
      const { result } = renderHook(() => useSessionTerminal(), { wrapper });

      await act(async () => {
        await result.current.create('s1');
      });

      expect(result.current.get('s1')).toBeDefined();
      expect(result.current.get('s1')?.terminal).toBeDefined();
    });

    it('未登録のセッションには undefined を返す', () => {
      const { result } = renderHook(() => useSessionTerminal(), { wrapper });

      expect(result.current.get('unknown')).toBeUndefined();
    });
  });

  describe('isExited', () => {
    it('終了していないセッションは false', async () => {
      const { result } = renderHook(() => useSessionTerminal(), { wrapper });

      await act(async () => {
        await result.current.create('s1');
      });

      expect(result.current.isExited('s1')).toBe(false);
    });

    it('exitedSessionsAtom に含まれるセッションは true', () => {
      store.set(exitedSessionsAtom, new Set(['s1']));

      const { result } = renderHook(() => useSessionTerminal(), { wrapper });

      expect(result.current.isExited('s1')).toBe(true);
    });
  });

  describe('remove', () => {
    it('remove 後に get が undefined を返す', async () => {
      const { result } = renderHook(() => useSessionTerminal(), { wrapper });

      await act(async () => {
        await result.current.create('s1');
      });

      expect(result.current.get('s1')).toBeDefined();

      act(() => {
        result.current.remove('s1');
      });

      expect(result.current.get('s1')).toBeUndefined();
    });
  });
});
