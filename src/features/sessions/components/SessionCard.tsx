import { Box, Flex, Text } from '@mantine/core';
import { DeleteSessionModal } from '@/features/sessions/components/DeleteSessionModal';
import type { Session } from '@/generated/Session';

interface SessionCardProps {
  session: Session;
}

export function SessionCard({ session }: SessionCardProps) {
  return (
    <Box px={16} py={8}>
      <Flex justify="space-between" align="center">
        <Text size="sm" fw={500} truncate>
          {session.branch_name}
        </Text>
        <DeleteSessionModal
          sessionId={session.id}
          branchName={session.branch_name}
        />
      </Flex>
      <Text size="xs" c="dimmed">
        base: {session.base_branch}
      </Text>
    </Box>
  );
}
