import { beforeEach, describe, expect, it } from 'vitest';
import { usePanelStore } from './store';

beforeEach(() => {
  usePanelStore.setState({ panels: {} });
});

describe('register', () => {
  it('新しいキーを登録できる', () => {
    usePanelStore.getState().register('files', true);

    expect(usePanelStore.getState().panels).toEqual({ files: true });
  });

  it('既存キーは上書きしない', () => {
    usePanelStore.getState().register('files', true);
    usePanelStore.getState().register('files', false);

    expect(usePanelStore.getState().panels.files).toBe(true);
  });
});

describe('toggle', () => {
  it('状態を反転する', () => {
    usePanelStore.getState().register('files', false);

    usePanelStore.getState().toggle('files');
    expect(usePanelStore.getState().panels.files).toBe(true);

    usePanelStore.getState().toggle('files');
    expect(usePanelStore.getState().panels.files).toBe(false);
  });
});

describe('open / close', () => {
  it('open で true に設定する', () => {
    usePanelStore.getState().register('files', false);

    usePanelStore.getState().open('files');
    expect(usePanelStore.getState().panels.files).toBe(true);
  });

  it('close で false に設定する', () => {
    usePanelStore.getState().register('files', true);

    usePanelStore.getState().close('files');
    expect(usePanelStore.getState().panels.files).toBe(false);
  });
});
