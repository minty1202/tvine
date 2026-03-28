import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { theme } from '@/config/theme/mantine';
import { DeleteSessionModal } from './DeleteSessionModal';

vi.mock('@/features/sessions/api/deleteSession', () => ({
  deleteSession: vi.fn(),
}));

import { deleteSession } from '@/features/sessions/api/deleteSession';

function renderModal(sessionId = 'test-id', branchName = 'feature/test') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <DeleteSessionModal sessionId={sessionId} branchName={branchName} />
      </MantineProvider>
    </QueryClientProvider>,
  );
}

describe('DeleteSessionModal', () => {
  beforeEach(() => {
    vi.mocked(deleteSession).mockReset();
  });

  it('削除ボタンでモーダルが開き、ブランチ名が表示される', async () => {
    const user = userEvent.setup();
    renderModal('id-1', 'feature/login');

    await user.click(screen.getByRole('button', { name: '削除' }));
    expect(await screen.findByText('feature/login')).toBeInTheDocument();
    expect(screen.getByText('削除する')).toBeInTheDocument();
  });

  it('削除実行時に deleteSession が呼ばれる', async () => {
    vi.mocked(deleteSession).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderModal('id-1', 'feature/test');

    await user.click(screen.getByRole('button', { name: '削除' }));
    await user.click(await screen.findByText('削除する'));

    await waitFor(() => {
      expect(deleteSession).toHaveBeenCalledWith('id-1');
    });
  });

  it('削除成功時にモーダルが閉じる', async () => {
    vi.mocked(deleteSession).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderModal('id-1', 'feature/test');

    await user.click(screen.getByRole('button', { name: '削除' }));
    await screen.findByText('セッションの削除');
    await user.click(screen.getByText('削除する'));

    await waitFor(() => {
      expect(screen.queryByText('セッションの削除')).not.toBeInTheDocument();
    });
  });

  it('削除失敗時にエラーが表示される', async () => {
    vi.mocked(deleteSession).mockRejectedValue('削除に失敗しました');
    const user = userEvent.setup();
    renderModal('id-1', 'feature/test');

    await user.click(screen.getByRole('button', { name: '削除' }));
    await user.click(await screen.findByText('削除する'));

    expect(await screen.findByText('削除に失敗しました')).toBeInTheDocument();
  });

  it('キャンセルでモーダルが閉じる', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: '削除' }));
    await screen.findByText('セッションの削除');
    await user.click(screen.getByText('キャンセル'));

    await waitFor(() => {
      expect(screen.queryByText('セッションの削除')).not.toBeInTheDocument();
    });
  });
});
