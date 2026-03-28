import { Text } from '@mantine/core';
import { Panel } from '@/components/panel/Panel';
import { CreateSessionModal } from '@/features/sessions/components/CreateSessionModal';
import { SessionList } from '@/features/sessions/components/SessionList';
import { useCreateSession } from '@/features/sessions/hooks/useCreateSession';
import { useListSessions } from '@/features/sessions/hooks/useListSessions';

export function SessionSidebar() {
  const mutation = useCreateSession();
  const { data: sessions } = useListSessions();

  return (
    <Panel w="15vw" miw={200} bg="dark.8">
      <Panel.Header justify="space-between">
        <Text size="xs" fw={600} c="dimmed" tt="uppercase">
          Worktrees
        </Text>
        <CreateSessionModal mutation={mutation} />
      </Panel.Header>
      <SessionList sessions={sessions} />
    </Panel>
  );
}
