import { Box, Button, Stack, Text } from '@mantine/core';
import { ClaudeTerminal } from '@/features/terminal/components/ClaudeTerminal';
import { useSessionTerminal } from '@/features/terminal/hooks/useSessionTerminal';

interface TerminalContentProps {
  sessionId: string | null;
}

export function TerminalContent({ sessionId }: TerminalContentProps) {
  const { isExited, restart } = useSessionTerminal();

  if (!sessionId) {
    return (
      <Box bg="dark.9" style={{ flex: 1, padding: 12 }}>
        <Text size="sm" c="dimmed">
          セッションを選択してください
        </Text>
      </Box>
    );
  }

  if (isExited(sessionId)) {
    return (
      <Stack
        bg="dark.9"
        align="center"
        justify="center"
        style={{ flex: 1 }}
        gap={16}
      >
        <Text size="sm" c="dimmed">
          セッションが終了しました
        </Text>
        <Button variant="light" size="sm" onClick={() => restart(sessionId)}>
          再開
        </Button>
      </Stack>
    );
  }

  return <ClaudeTerminal sessionId={sessionId} />;
}
