import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BUSY_THRESHOLD_MS,
  GAP_THRESHOLD_MS,
  activityMonitor as monitor,
  SILENCE_THRESHOLD_MS,
} from './ptyActivityMonitor';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  monitor.cleanup('s1');
  vi.useRealTimers();
});

function makeCallbacks() {
  return { onEvaluating: vi.fn(), onBusy: vi.fn(), onIdle: vi.fn() };
}

/** ストリーミング出力をシミュレート（200ms 間隔で count 回出力） */
function simulateStreaming(
  sessionId: string,
  cb: ReturnType<typeof makeCallbacks>,
  count: number,
) {
  for (let i = 0; i < count; i++) {
    vi.advanceTimersByTime(200);
    monitor.onPtyOutput(sessionId, cb);
  }
}

/** BUSY_THRESHOLD を超えるのに必要な出力回数（200ms 間隔） */
const STREAMING_COUNT_FOR_BUSY = Math.ceil(BUSY_THRESHOLD_MS / 200) + 1;

describe('ptyActivityMonitor', () => {
  it('PTY 出力で Evaluating になる', () => {
    const cb = makeCallbacks();

    monitor.onPtyOutput('s1', cb);

    expect(cb.onEvaluating).toHaveBeenCalledOnce();
    expect(cb.onBusy).not.toHaveBeenCalled();
    expect(cb.onIdle).not.toHaveBeenCalled();
  });

  it('連続出力が BUSY_THRESHOLD を超えると Busy に昇格する', () => {
    const cb = makeCallbacks();

    monitor.onPtyOutput('s1', cb);
    simulateStreaming('s1', cb, STREAMING_COUNT_FOR_BUSY);

    expect(cb.onBusy).toHaveBeenCalled();
  });

  it('BUSY_THRESHOLD 以内の連続出力では Busy に昇格しない', () => {
    const cb = makeCallbacks();

    monitor.onPtyOutput('s1', cb);
    simulateStreaming('s1', cb, 5);

    expect(cb.onBusy).not.toHaveBeenCalled();
    expect(cb.onEvaluating).toHaveBeenCalled();
  });

  it('ゆっくり打っても Busy に昇格しない（GAP で連続性がリセットされる）', () => {
    const cb = makeCallbacks();

    monitor.onPtyOutput('s1', cb);
    for (let i = 0; i < 10; i++) {
      vi.advanceTimersByTime(GAP_THRESHOLD_MS + 100);
      monitor.onPtyOutput('s1', cb);
    }

    expect(cb.onBusy).not.toHaveBeenCalled();
  });

  it('沈黙が SILENCE_THRESHOLD 続くと Idle になる', () => {
    const cb = makeCallbacks();

    monitor.onPtyOutput('s1', cb);
    vi.advanceTimersByTime(SILENCE_THRESHOLD_MS);

    expect(cb.onIdle).toHaveBeenCalledOnce();
  });

  it('Busy 中に出力が GAP_THRESHOLD 途切れると Evaluating に降格する', () => {
    const cb = makeCallbacks();

    monitor.onPtyOutput('s1', cb);
    simulateStreaming('s1', cb, STREAMING_COUNT_FOR_BUSY);
    expect(cb.onBusy).toHaveBeenCalled();

    cb.onEvaluating.mockClear();

    vi.advanceTimersByTime(GAP_THRESHOLD_MS);
    expect(cb.onEvaluating).toHaveBeenCalledOnce();
  });

  it('Busy から降格後、出力が来たら即 Busy に復帰する', () => {
    const cb = makeCallbacks();

    // Busy まで昇格
    monitor.onPtyOutput('s1', cb);
    simulateStreaming('s1', cb, STREAMING_COUNT_FOR_BUSY);

    // Evaluating に降格
    vi.advanceTimersByTime(GAP_THRESHOLD_MS);
    cb.onBusy.mockClear();

    // 出力 1 回で即 Busy 復帰（5 秒待たない）
    monitor.onPtyOutput('s1', cb);
    expect(cb.onBusy).toHaveBeenCalledOnce();
  });

  it('Evaluating（初回）から沈黙で Idle になる', () => {
    const cb = makeCallbacks();

    monitor.onPtyOutput('s1', cb);
    vi.advanceTimersByTime(SILENCE_THRESHOLD_MS);

    expect(cb.onIdle).toHaveBeenCalled();
  });

  it('Evaluating（Busy 降格後）から沈黙で Idle になる', () => {
    const cb = makeCallbacks();

    // Busy まで昇格 → Evaluating に降格
    monitor.onPtyOutput('s1', cb);
    simulateStreaming('s1', cb, STREAMING_COUNT_FOR_BUSY);
    vi.advanceTimersByTime(GAP_THRESHOLD_MS);

    // 沈黙 → Idle
    vi.advanceTimersByTime(SILENCE_THRESHOLD_MS);
    expect(cb.onIdle).toHaveBeenCalled();
  });

  it('cleanup 後はタイマーが発火しない', () => {
    const cb = makeCallbacks();

    monitor.onPtyOutput('s1', cb);
    monitor.cleanup('s1');
    vi.advanceTimersByTime(SILENCE_THRESHOLD_MS);

    expect(cb.onIdle).not.toHaveBeenCalled();
  });

  it('セッションごとに独立して動作する', () => {
    const cb1 = makeCallbacks();
    const cb2 = makeCallbacks();

    monitor.onPtyOutput('s1', cb1);
    monitor.onPtyOutput('s2', cb2);

    monitor.cleanup('s1');
    vi.advanceTimersByTime(SILENCE_THRESHOLD_MS);

    expect(cb1.onIdle).not.toHaveBeenCalled();
    expect(cb2.onIdle).toHaveBeenCalledOnce();

    monitor.cleanup('s2');
  });
});
