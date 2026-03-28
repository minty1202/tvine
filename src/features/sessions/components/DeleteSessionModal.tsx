import { ActionIcon, Alert, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconTrash } from '@tabler/icons-react';
import { useAtom } from 'jotai';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useDeleteSession } from '@/features/sessions/hooks/useDeleteSession';
import { useSessionTerminal } from '@/hooks/useSessionTerminal';
import { selectedSessionIdAtom } from '@/stores/sessionStore';

interface DeleteSessionModalProps {
  sessionId: string;
  branchName: string;
}

export function DeleteSessionModal({
  sessionId,
  branchName,
}: DeleteSessionModalProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const mutation = useDeleteSession();
  const { remove } = useSessionTerminal();
  const [selectedId, setSelectedId] = useAtom(selectedSessionIdAtom);

  const handleClose = () => {
    mutation.reset();
    close();
  };

  const handleConfirm = () => {
    mutation.mutate(sessionId, {
      onSuccess: () => {
        remove(sessionId);
        if (selectedId === sessionId) {
          setSelectedId(null);
        }
        handleClose();
      },
    });
  };

  return (
    <>
      <ActionIcon
        size="sm"
        variant="subtle"
        color="red"
        onClick={open}
        aria-label="削除"
      >
        <IconTrash size={14} />
      </ActionIcon>

      <ConfirmModal
        opened={opened}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="セッションの削除"
        confirmLabel="削除する"
      >
        {mutation.isError && (
          <Alert color="red" variant="light">
            {String(mutation.error)}
          </Alert>
        )}
        <Text size="sm">
          <Text span fw={600}>
            {branchName}
          </Text>{' '}
          を削除しますか？ worktree とセッション情報が削除されます。
        </Text>
      </ConfirmModal>
    </>
  );
}
