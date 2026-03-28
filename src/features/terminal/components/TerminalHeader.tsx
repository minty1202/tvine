import { Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { Panel } from '@/components/panel/Panel';

interface TerminalHeaderProps {
  sessionId: string | null;
  panelToggles?: ReactNode;
}

export function TerminalHeader({
  sessionId,
  panelToggles,
}: TerminalHeaderProps) {
  return (
    <Panel.Header gap={10} bg="dark.8">
      {panelToggles}
      {sessionId && (
        <Text size="xs" c="dimmed">
          {sessionId}
        </Text>
      )}
    </Panel.Header>
  );
}
