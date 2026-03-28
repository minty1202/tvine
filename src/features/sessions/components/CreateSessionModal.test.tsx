import { MantineProvider } from '@mantine/core';
import type { UseMutationResult } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { theme } from '@/config/theme/mantine';
import type { CreateSessionValues } from '@/features/sessions/utils/createSessionSchema';
import type { Session } from '@/generated/Session';
import { CreateSessionModal } from './CreateSessionModal';

vi.mock('@/hooks/useSessionTerminal', () => ({
  useSessionTerminal: () => ({
    create: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
    isExited: vi.fn(),
  }),
}));

type SessionMutation = UseMutationResult<Session, unknown, CreateSessionValues>;

function baseMutation(): SessionMutation {
  return {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    data: undefined,
    error: null,
    variables: undefined,
    isIdle: true,
    isPending: false,
    isSuccess: false,
    isError: false,
    status: 'idle',
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    context: undefined,
    submittedAt: 0,
  };
}

function renderModal(mutation: SessionMutation) {
  return render(
    <MantineProvider theme={theme}>
      <CreateSessionModal mutation={mutation} />
    </MantineProvider>,
  );
}

async function openModalAndFillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText('+ New'));
  const baseInput = await screen.findByLabelText('ベースブランチ');
  await user.clear(baseInput);
  await user.type(baseInput, 'main');
  await user.type(await screen.findByLabelText('ブランチ名'), 'feature/test');
}

describe('CreateSessionModal', () => {
  let mutation: SessionMutation;

  beforeEach(() => {
    mutation = baseMutation();
  });

  it('送信時に mutate が呼ばれる', async () => {
    const user = userEvent.setup();
    renderModal(mutation);

    await openModalAndFillForm(user);
    await user.click(screen.getByText('作成する'));

    expect(mutation.mutate).toHaveBeenCalledWith(
      { baseBranch: 'main', branchName: 'feature/test' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('isPending 中はボタンが無効になる', async () => {
    const user = userEvent.setup();
    mutation.isPending = true;
    mutation.isIdle = false;
    mutation.status = 'pending';
    renderModal(mutation);

    await user.click(screen.getByText('+ New'));
    const submitButton = await screen.findByText('作成する');
    expect(submitButton.closest('button')).toBeDisabled();
  });

  it('エラー時に Alert が表示される', async () => {
    const user = userEvent.setup();
    mutation.isError = true;
    mutation.isIdle = false;
    mutation.status = 'error';
    mutation.error = 'branch already exists';
    renderModal(mutation);

    await user.click(screen.getByText('+ New'));

    expect(
      await screen.findByText('branch already exists'),
    ).toBeInTheDocument();
  });

  it('モーダルを閉じると mutation.reset が呼ばれる', async () => {
    const user = userEvent.setup();
    mutation.isError = true;
    mutation.isIdle = false;
    mutation.status = 'error';
    mutation.error = 'some error';
    renderModal(mutation);

    await user.click(screen.getByText('+ New'));
    await screen.findByText('some error');

    // モーダルの × ボタンで閉じる（Mantine の CloseButton は aria-label なし）
    const closeButton = document.querySelector('.mantine-Modal-close');
    await user.click(closeButton as HTMLElement);

    await waitFor(() => {
      expect(mutation.reset).toHaveBeenCalled();
    });
  });

  it('成功時の onSuccess コールバックでモーダルが閉じる', async () => {
    const user = userEvent.setup();
    const fakeSession: Session = {
      id: 'test-uuid',
      branch_name: 'feature/test',
      base_branch: 'main',
      worktree_path: '/tmp/test',
      created_at: '2026-01-01T00:00:00Z',
    };
    (mutation.mutate as Mock).mockImplementation((_values, options) => {
      options?.onSuccess?.(fakeSession);
    });
    renderModal(mutation);

    await openModalAndFillForm(user);
    await user.click(screen.getByText('作成する'));

    await waitFor(() => {
      expect(screen.queryByText('新しいセッション')).not.toBeInTheDocument();
    });
  });
});
