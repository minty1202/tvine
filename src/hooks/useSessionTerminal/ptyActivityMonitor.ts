/**
 * PTY 出力監視によるステータス検出（3 状態遷移）
 *
 * autocomplete の debounce と同じ原理で、PTY 出力の有無から
 * Evaluating / Busy / Idle を判定する。
 *
 * ## 状態遷移
 *
 * Idle → (PTY 出力) → Evaluating → (連続出力が 5 秒続く) → Busy
 *                         ↑                                    ↓
 *                         ↑←←←←← (出力が 1 秒途切れる) ←←←←←←↓
 *                         ↓
 *                    (沈黙 2 秒) → Idle
 *                    (出力再開) → Busy（即復帰）
 *
 * ## 再昇格ルール
 *
 * Evaluating には「どこから来たか」（fromBusy フラグ）を持たせる。
 * - Idle から来た: 初回昇格。連続出力が BUSY_THRESHOLD 続くまで Busy にならない
 * - Busy から来た: 再昇格。出力が来たら即 Busy に復帰
 *
 * これにより、Claude の自然な間（ツール実行待ち等）では即復帰し、
 * ユーザーのタイピングでは 5 秒のフィルタが効く。
 */

import type { SessionStatus } from '@/stores/statusStore';

/** Evaluating → Busy の初回昇格。連続出力がこの時間続いたら確実に作業中と判定 */
export const BUSY_THRESHOLD_MS = 5000;
/** Busy → Evaluating の降格。出力がこの時間途切れたら判断中に戻す */
export const GAP_THRESHOLD_MS = 1000;
/** Evaluating → Idle。出力がこの時間なければ完全に停止と判定 */
export const SILENCE_THRESHOLD_MS = 2000;

type ActivityEntry = {
  status: SessionStatus;
  evaluatingStartTime: number;
  lastOutputTime: number;
  fromBusy: boolean;
  silenceTimer: ReturnType<typeof setTimeout>;
  gapTimer: ReturnType<typeof setTimeout> | null;
};

const entries = new Map<string, ActivityEntry>();

type Callbacks = {
  onEvaluating: () => void;
  onBusy: () => void;
  onIdle: () => void;
};

const clearTimers = (entry: ActivityEntry) => {
  clearTimeout(entry.silenceTimer);
  if (entry.gapTimer) clearTimeout(entry.gapTimer);
};

const startGapTimer = (
  sessionId: string,
  entry: ActivityEntry,
  callbacks: Callbacks,
) => {
  entry.gapTimer = setTimeout(() => {
    callbacks.onEvaluating();
    entry.status = 'Evaluating';
    entry.fromBusy = true;
    entry.lastOutputTime = Date.now();

    // gap 降格時に silence タイマーをリセット
    // リセットしないと、最後の onPtyOutput 起点の silence が先に発火して
    // Evaluating 滞在が SILENCE_THRESHOLD より短くなる
    clearTimeout(entry.silenceTimer);
    entry.silenceTimer = setTimeout(() => {
      callbacks.onIdle();
      const e = entries.get(sessionId);
      if (e) e.status = 'Idle';
    }, SILENCE_THRESHOLD_MS);
  }, GAP_THRESHOLD_MS);
};

const promoteToBusy = (
  sessionId: string,
  entry: ActivityEntry,
  callbacks: Callbacks,
) => {
  callbacks.onBusy();
  entry.status = 'Busy';
  entry.fromBusy = false;
  startGapTimer(sessionId, entry, callbacks);
};

const handleIdle = (
  sessionId: string,
  now: number,
  callbacks: Callbacks,
  silenceTimer: ReturnType<typeof setTimeout>,
) => {
  callbacks.onEvaluating();
  entries.set(sessionId, {
    status: 'Evaluating',
    evaluatingStartTime: now,
    lastOutputTime: now,
    fromBusy: false,
    silenceTimer,
    gapTimer: null,
  });
};

const handleEvaluating = (
  sessionId: string,
  entry: ActivityEntry,
  now: number,
  callbacks: Callbacks,
) => {
  // Busy から降格した Evaluating → 即復帰
  if (entry.fromBusy) {
    entry.lastOutputTime = now;
    promoteToBusy(sessionId, entry, callbacks);
    return;
  }

  // 初回昇格: 前回の出力から GAP_THRESHOLD 以上空いていたら連続性リセット
  if (now - entry.lastOutputTime > GAP_THRESHOLD_MS) {
    entry.evaluatingStartTime = now;
  }
  entry.lastOutputTime = now;

  if (now - entry.evaluatingStartTime > BUSY_THRESHOLD_MS) {
    promoteToBusy(sessionId, entry, callbacks);
  }
};

const handleBusy = (
  sessionId: string,
  entry: ActivityEntry,
  now: number,
  callbacks: Callbacks,
) => {
  entry.lastOutputTime = now;
  startGapTimer(sessionId, entry, callbacks);
};

/**
 * PTY 出力があったときに呼ぶ。
 * 状態に応じて Evaluating → Busy の昇格、Busy の維持を行う。
 */
const onPtyOutput = (sessionId: string, callbacks: Callbacks) => {
  const now = Date.now();
  const entry = entries.get(sessionId);

  if (entry) clearTimers(entry);

  // silence タイマーは全状態で共通
  const silenceTimer = setTimeout(() => {
    callbacks.onIdle();
    const e = entries.get(sessionId);
    if (e) e.status = 'Idle';
  }, SILENCE_THRESHOLD_MS);

  if (!entry || entry.status === 'Idle') {
    handleIdle(sessionId, now, callbacks, silenceTimer);
    return;
  }

  entry.silenceTimer = silenceTimer;

  if (entry.status === 'Evaluating') {
    handleEvaluating(sessionId, entry, now, callbacks);
    return;
  }

  handleBusy(sessionId, entry, now, callbacks);
};

/**
 * セッション終了時にタイマーを破棄する。
 */
const cleanup = (sessionId: string) => {
  const entry = entries.get(sessionId);
  if (entry) clearTimers(entry);
  entries.delete(sessionId);
};

export const activityMonitor = { onPtyOutput, cleanup };
