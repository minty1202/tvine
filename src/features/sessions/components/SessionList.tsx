import { Box, ScrollArea, Text } from '@mantine/core';
import { useAtom } from 'jotai';
import { SessionCard } from '@/features/sessions/components/SessionCard';
import type { Session } from '@/generated/Session';
import { useSessionTerminal } from '@/hooks/useSessionTerminal';
import { selectedSessionIdAtom } from '@/stores/sessionStore';

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
  const [selectedId, setSelectedId] = useAtom(selectedSessionIdAtom);
  const { create } = useSessionTerminal();

  if (!sessions || sessions.length === 0) {
    return <EmptySessionMessage />;
  }

  const handleSelect = (session: Session) => {
    setSelectedId(session.id);
    create(session.id);
  };

  return (
    <ScrollArea flex={1}>
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          selected={session.id === selectedId}
          onClick={() => handleSelect(session)}
        />
      ))}
    </ScrollArea>
  );
}
