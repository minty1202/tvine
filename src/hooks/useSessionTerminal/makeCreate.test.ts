import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionStatus } from '@/stores/statusStore';
import type { TerminalEntry } from '@/stores/terminalStore';
import { BUSY_THRESHOLD_MS, SILENCE_THRESHOLD_MS } from './ptyActivityMonitor';

type Listener = (event: { payload: unknown }) => void;
const listeners = new Map<string, Listener>();
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(async (eventName: string, callback: Listener) => {
    listeners.set(eventName, callback);
    return vi.fn();
  }),
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
      cols: 80,
      rows: 24,
    },
    fitAddon: {},
  }),
}));

import { makeCreate } from './makeCreate';
import { activityMonitor } from './ptyActivityMonitor';

function createDeps() {
  const terminals = new Map<string, TerminalEntry>();
  const exitedSessions = new Set<string>();
  let statusMap = new Map<string, SessionStatus>();

  const setTerminals = vi.fn(
    (fn: (prev: Map<string, TerminalEntry>) => Map<string, TerminalEntry>) => {
      const next = fn(terminals);
      terminals.clear();
      for (const [k, v] of next) terminals.set(k, v);
    },
  );

  const setExitedSessions = vi.fn((fn: (prev: Set<string>) => Set<string>) => {
    const next = fn(exitedSessions);
    exitedSessions.clear();
    for (const v of next) exitedSessions.add(v);
  });

  const setStatusMap = vi.fn(
    (fn: (prev: Map<string, SessionStatus>) => Map<string, SessionStatus>) => {
      statusMap = fn(statusMap);
    },
  );

  const cleanup = vi.fn();

  return {
    terminals,
    exitedSessions,
    statusMap: () => statusMap,
    setTerminals,
    setExitedSessions,
    setStatusMap,
    cleanup,
  };
}

function emit(eventName: string, payload: unknown) {
  const listener = listeners.get(eventName);
  if (listener) listener({ payload });
}

describe('makeCreate', () => {
  beforeEach(() => {
    listeners.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    activityMonitor.cleanup('s1');
    vi.useRealTimers();
  });

  it('create 後に TerminalEntry が登録される', async () => {
    const deps = createDeps();
    const create = makeCreate(deps);

    await create('s1');

    expect(deps.terminals.has('s1')).toBe(true);
  });

  it('既にアクティブなセッションがあれば何もしない', async () => {
    const deps = createDeps();
    const create = makeCreate(deps);

    await create('s1');
    deps.cleanup.mockClear();

    await create('s1');

    expect(deps.cleanup).not.toHaveBeenCalled();
  });

  it('pty-output イベントで terminal.write が呼ばれる', async () => {
    const deps = createDeps();
    const create = makeCreate(deps);

    await create('s1');

    const entry = deps.terminals.get('s1');
    expect(entry).toBeDefined();
    emit('pty-output', { session_id: 's1', data: [72, 105] });

    expect(entry?.terminal.write).toHaveBeenCalledWith(
      new Uint8Array([72, 105]),
    );
  });

  it('pty-output イベントでステータスが Evaluating になる', async () => {
    const deps = createDeps();
    const create = makeCreate(deps);

    await create('s1');

    emit('pty-output', { session_id: 's1', data: [0] });

    expect(deps.statusMap().get('s1')).toBe('Evaluating');
  });

  it('出力が続くとステータスが Busy に昇格する', async () => {
    const deps = createDeps();
    const create = makeCreate(deps);

    await create('s1');

    emit('pty-output', { session_id: 's1', data: [0] });
    const count = Math.ceil(BUSY_THRESHOLD_MS / 200) + 1;
    for (let i = 0; i < count; i++) {
      vi.advanceTimersByTime(200);
      emit('pty-output', { session_id: 's1', data: [0] });
    }

    expect(deps.statusMap().get('s1')).toBe('Busy');
  });

  it('PTY 出力後の沈黙でステータスが Idle になる', async () => {
    const deps = createDeps();
    const create = makeCreate(deps);

    await create('s1');

    emit('pty-output', { session_id: 's1', data: [0] });
    vi.advanceTimersByTime(SILENCE_THRESHOLD_MS);

    expect(deps.statusMap().get('s1')).toBe('Idle');
  });

  it('別セッションの pty-output は無視する', async () => {
    const deps = createDeps();
    const create = makeCreate(deps);

    await create('s1');

    emit('pty-output', { session_id: 'other', data: [0] });

    expect(deps.statusMap().get('s1')).toBeUndefined();
  });

  it('pty-exit イベントで exitedSessions に追加されステータスが Idle になる', async () => {
    const deps = createDeps();
    const create = makeCreate(deps);

    await create('s1');

    emit('pty-exit', { session_id: 's1' });

    expect(deps.exitedSessions.has('s1')).toBe(true);
    expect(deps.statusMap().get('s1')).toBe('Idle');
  });
});
