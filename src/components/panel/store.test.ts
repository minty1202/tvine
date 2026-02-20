import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { resetPanelAtoms, usePanel } from './store';

beforeEach(() => {
  resetPanelAtoms();
});

describe('usePanel', () => {
  it('デフォルト値で初期化される', () => {
    const { result } = renderHook(() => usePanel('files', true));

    expect(result.current[0]).toBe(true);
  });

  it('既存キーのデフォルト値は上書きしない', () => {
    renderHook(() => usePanel('files', true));
    const { result } = renderHook(() => usePanel('files', false));

    expect(result.current[0]).toBe(true);
  });

  it('toggle で状態を反転する', () => {
    const { result } = renderHook(() => usePanel('files', false));

    act(() => result.current[1].toggle());
    expect(result.current[0]).toBe(true);

    act(() => result.current[1].toggle());
    expect(result.current[0]).toBe(false);
  });

  it('open で true に設定する', () => {
    const { result } = renderHook(() => usePanel('files', false));

    act(() => result.current[1].open());
    expect(result.current[0]).toBe(true);
  });

  it('close で false に設定する', () => {
    const { result } = renderHook(() => usePanel('files', true));

    act(() => result.current[1].close());
    expect(result.current[0]).toBe(false);
  });
});
