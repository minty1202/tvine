import { Flex, Text } from '@mantine/core';
import { useAtomValue } from 'jotai';
import { SelectableCard } from '@/components/SelectableCard';
import { DeleteSessionModal } from '@/features/sessions/components/DeleteSessionModal';
import { StatusIndicator } from '@/features/sessions/components/StatusIndicator';
import type { Session } from '@/generated/Session';
import type { SessionStatus } from '@/stores/statusStore';
import { statusMapAtom } from '@/stores/statusStore';

interface SessionCardProps {
  session: Session;
  selected?: boolean;
  onClick?: () => void;
}

export function SessionCard({ session, selected, onClick }: SessionCardProps) {
  const statusMap = useAtomValue(statusMapAtom);
  const status: SessionStatus = statusMap.get(session.id) ?? 'Idle';

  return (
    <SelectableCard mx={8} mt={8} selected={selected} onClick={onClick}>
      <Flex align="center" gap={8}>
        <StatusIndicator status={status} />
        <Text size="sm" fw={500} truncate>
          {session.branch_name}
        </Text>
      </Flex>
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
