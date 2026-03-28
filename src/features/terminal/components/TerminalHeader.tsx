import { Text } from '@mantine/core';
import { Panel } from '@/components/panel/Panel';
import { DiffPanelToggle } from '@/features/diff/components/DiffPanel';
import { ShellPanelToggle } from '@/features/shell/components/ShellPanel';

interface TerminalHeaderProps {
  sessionId: string | null;
}

export function TerminalHeader({ sessionId }: TerminalHeaderProps) {
  return (
    <Panel.Header gap={10} bg="dark.8">
      <DiffPanelToggle />
      <ShellPanelToggle />
      {sessionId && (
        <Text size="xs" c="dimmed">
          {sessionId}
        </Text>
      )}
    </Panel.Header>
  );
}
