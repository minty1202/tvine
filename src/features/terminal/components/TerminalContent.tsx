import { Box, Text } from '@mantine/core';
import { ClaudeTerminal } from '@/features/terminal/components/ClaudeTerminal';

interface TerminalContentProps {
  sessionId: string | null;
}

export function TerminalContent({ sessionId }: TerminalContentProps) {
  if (!sessionId) {
    return (
      <Box bg="dark.9" style={{ flex: 1, padding: 12 }}>
        <Text size="sm" c="dimmed">
          セッションを選択してください
        </Text>
      </Box>
    );
  }

  return <ClaudeTerminal sessionId={sessionId} />;
}
