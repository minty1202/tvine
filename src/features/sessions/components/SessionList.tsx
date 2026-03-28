import { Box, ScrollArea, Text } from '@mantine/core';
import { SessionCard } from '@/features/sessions/components/SessionCard';
import type { Session } from '@/generated/Session';

function EmptySessionMessage() {
  return (
    <Box p={16}>
      <Text size="sm" c="dimmed">
        セッションがありません
      </Text>
    </Box>
  );
}

interface SessionListProps {
  sessions: Session[] | undefined;
}

export function SessionList({ sessions }: SessionListProps) {
  if (!sessions || sessions.length === 0) {
    return <EmptySessionMessage />;
  }

  return (
    <ScrollArea flex={1}>
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}
    </ScrollArea>
  );
}
