import { Text } from '@mantine/core';
import { IconFileDiff, IconTerminal2 } from '@tabler/icons-react';
import { CollapsiblePanel } from '@/components/panel/CollapsiblePanel';
import { Panel } from '@/components/panel/Panel';

const ICON_SIZE = 16;

interface TerminalHeaderProps {
  sessionId: string | null;
}

export function TerminalHeader({ sessionId }: TerminalHeaderProps) {
  return (
    <Panel.Header gap={10} bg="dark.8">
      <CollapsiblePanel.Toggle
        panelKey="changes"
        icon={<IconFileDiff size={ICON_SIZE} />}
        defaultOpened
      />
      <CollapsiblePanel.Toggle
        panelKey="terminal"
        icon={<IconTerminal2 size={ICON_SIZE} />}
      />
      {sessionId && (
        <Text size="xs" c="dimmed">
          {sessionId}
        </Text>
      )}
    </Panel.Header>
  );
}
