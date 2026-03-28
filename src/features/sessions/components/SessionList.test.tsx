import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { describe, expect, it, vi } from 'vitest';
import { theme } from '@/config/theme/mantine';
import type { Session } from '@/generated/Session';
import { selectedSessionIdAtom } from '@/stores/sessionStore';
import { SessionList } from './SessionList';

const mockCreate = vi.fn();

vi.mock('@/hooks/useSessionTerminal', () => ({
  useSessionTerminal: () => ({
    create: mockCreate,
    get: vi.fn(),
    remove: vi.fn(),
  }),
}));

vi.mock('@/features/sessions/api/deleteSession', () => ({
  deleteSession: vi.fn(),
}));

function makeSession(id: string, branchName: string): Session {
  return {
    id,
    branch_name: branchName,
    base_branch: 'main',
    worktree_path: `/tmp/${branchName}`,
    created_at: '2026-01-01T00:00:00Z',
  };
}

function renderSessionList(
  sessions: Session[] | undefined,
  store = createStore(),
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return {
    store,
    ...render(
      <QueryClientProvider client={queryClient}>
        <JotaiProvider store={store}>
          <MantineProvider theme={theme}>
            <SessionList sessions={sessions} />
          </MantineProvider>
        </JotaiProvider>
      </QueryClientProvider>,
    ),
  };
}

describe('SessionList', () => {
  it('セッションが空のとき案内メッセージを表示する', () => {
    renderSessionList([]);
    expect(screen.getByText('セッションがありません')).toBeInTheDocument();
  });

  it('undefined のとき案内メッセージを表示する', () => {
    renderSessionList(undefined);
    expect(screen.getByText('セッションがありません')).toBeInTheDocument();
  });

  it('セッション一覧を表示する', () => {
    const sessions = [
      makeSession('id-1', 'feature/login'),
      makeSession('id-2', 'feature/signup'),
    ];
    renderSessionList(sessions);

    expect(screen.getByText('feature/login')).toBeInTheDocument();
    expect(screen.getByText('feature/signup')).toBeInTheDocument();
  });

  it('カードクリックで選択状態が更新される', async () => {
    const user = userEvent.setup();
    const sessions = [
      makeSession('id-1', 'feature/login'),
      makeSession('id-2', 'feature/signup'),
    ];
    const { store } = renderSessionList(sessions);

    await user.click(screen.getByText('feature/login'));

    expect(store.get(selectedSessionIdAtom)).toBe('id-1');
  });

  it('カードクリックで Terminal の create が呼ばれる', async () => {
    const user = userEvent.setup();
    const sessions = [makeSession('id-1', 'feature/login')];
    renderSessionList(sessions);

    await user.click(screen.getByText('feature/login'));

    expect(mockCreate).toHaveBeenCalledWith('id-1');
  });
});
