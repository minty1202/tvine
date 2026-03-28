import { Button, Modal, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { validateBranchName } from '@/features/sessions/utils/validateBranchName';

type FormValues = {
  baseBranch: string;
  branchName: string;
};

export function CreateSessionModal() {
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm<FormValues>({
    initialValues: {
      baseBranch: 'main',
      branchName: '',
    },
    validate: {
      branchName: validateBranchName,
    },
  });

  const handleClose = () => {
    form.reset();
    close();
  };

  const handleSubmit = (values: FormValues) => {
    console.log('submit', values);
    handleClose();
  };

  return (
    <>
      <Button size="compact-xs" onClick={open}>
        + New
      </Button>

      <Modal opened={opened} onClose={handleClose} title="新しいセッション" centered>
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
