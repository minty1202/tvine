import { Box, Text } from '@mantine/core';
import { Panel } from '@/components/panel/Panel';
import { CreateSessionModal } from '@/features/sessions/components/CreateSessionModal';
import { useCreateSession } from '@/features/sessions/hooks/useCreateSession';

export function SessionSidebar() {
  const { createSession } = useCreateSession();

  return (
    <Panel w="15vw" miw={200} bg="dark.8">
      <Panel.Header justify="space-between">
        <Text size="xs" fw={600} c="dimmed" tt="uppercase">
          Worktrees
        </Text>
        <CreateSessionModal onSubmit={createSession} />
      </Panel.Header>
      <Box p={8}>Sidebar content</Box>
    </Panel>
  );
}
