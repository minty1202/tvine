import { Alert, Button, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useDeleteSession } from '@/features/sessions/hooks/useDeleteSession';

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

  const handleClose = () => {
    mutation.reset();
    close();
  };

  const handleConfirm = () => {
    mutation.mutate(sessionId, {
      onSuccess: () => handleClose(),
    });
  };

  return (
    <>
      <Button size="compact-xs" variant="subtle" color="red" onClick={open}>
        削除
      </Button>

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
