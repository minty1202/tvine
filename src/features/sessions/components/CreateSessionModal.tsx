import { Alert, Button, Modal, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import type { UseMutationResult } from '@tanstack/react-query';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import {
  type CreateSessionValues,
  createSessionSchema,
} from '@/features/sessions/utils/createSessionSchema';
import type { Session } from '@/generated/Session';

interface CreateSessionModalProps {
  mutation: UseMutationResult<Session, Error, CreateSessionValues>;
}

export function CreateSessionModal({ mutation }: CreateSessionModalProps) {
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm<CreateSessionValues>({
    initialValues: {
      baseBranch: 'main',
      branchName: '',
    },
    validate: zod4Resolver(createSessionSchema),
  });

  const handleClose = () => {
    form.reset();
    mutation.reset();
    close();
  };

  const handleSubmit = (values: CreateSessionValues) => {
    mutation.mutate(values, {
      onSuccess: () => handleClose(),
    });
  };

  return (
    <>
      <Button size="compact-xs" onClick={open}>
        + New
      </Button>

      <Modal
        opened={opened}
        onClose={handleClose}
        title="新しいセッション"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            {mutation.isError && (
              <Alert color="red" variant="light">
                {mutation.error.message}
              </Alert>
            )}
            <TextInput
              label="ベースブランチ"
              {...form.getInputProps('baseBranch')}
            />
            <TextInput
              label="ブランチ名"
              placeholder="feature/xxx"
              {...form.getInputProps('branchName')}
            />
            <Button fullWidth type="submit" loading={mutation.isPending}>
              作成する
            </Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
