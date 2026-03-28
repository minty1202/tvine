import { Flex, Text } from '@mantine/core';
import { SelectableCard } from '@/components/SelectableCard';
import { DeleteSessionModal } from '@/features/sessions/components/DeleteSessionModal';
import type { Session } from '@/generated/Session';

interface SessionCardProps {
  session: Session;
  selected?: boolean;
  onClick?: () => void;
}

export function SessionCard({ session, selected, onClick }: SessionCardProps) {
  return (
    <SelectableCard mx={8} mt={8} selected={selected} onClick={onClick}>
      <Text size="sm" fw={500} truncate>
        {session.branch_name}
      </Text>
      <Flex justify="space-between" align="center">
        <Text size="xs" c="dimmed">
          base: {session.base_branch}
        </Text>
        <DeleteSessionModal
          sessionId={session.id}
          branchName={session.branch_name}
        />
      </Flex>
    </SelectableCard>
  );
}
