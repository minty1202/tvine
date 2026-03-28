import { Button, Modal, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import {
  type CreateSessionValues,
  createSessionSchema,
} from '@/features/sessions/utils/createSessionSchema';

interface CreateSessionModalProps {
  onSubmit: (values: CreateSessionValues) => Promise<void>;
}

export function CreateSessionModal({ onSubmit }: CreateSessionModalProps) {
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
    close();
  };

  const handleSubmit = async (values: CreateSessionValues) => {
    await onSubmit(values);
    handleClose();
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
            <TextInput
              label="ベースブランチ"
              {...form.getInputProps('baseBranch')}
            />
            <TextInput
              label="ブランチ名"
              placeholder="feature/xxx"
              {...form.getInputProps('branchName')}
            />
            <Button fullWidth type="submit">
              作成する
            </Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
