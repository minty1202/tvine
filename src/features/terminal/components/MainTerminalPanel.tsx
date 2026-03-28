import { Box, Text } from '@mantine/core';
import { IconFileDiff, IconTerminal2 } from '@tabler/icons-react';
import { useAtomValue } from 'jotai';
import { CollapsiblePanel } from '@/components/panel/CollapsiblePanel';
import { Panel } from '@/components/panel/Panel';
import { ClaudeTerminal } from '@/features/terminal/components/ClaudeTerminal';
import { selectedSessionIdAtom } from '@/stores/sessionStore';

const ICON_SIZE = 16;

export function MainTerminalPanel() {
  const selectedSessionId = useAtomValue(selectedSessionIdAtom);

  return (
    <Panel style={{ flex: 1, minWidth: 0 }}>
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
        {selectedSessionId && (
          <Text size="xs" c="dimmed">
            {selectedSessionId}
          </Text>
        )}
      </Panel.Header>
      {selectedSessionId ? (
        <ClaudeTerminal sessionId={selectedSessionId} />
      ) : (
        <Box bg="dark.9" style={{ flex: 1, padding: 12 }}>
          <Text size="sm" c="dimmed">
            セッションを選択してください
          </Text>
        </Box>
      )}
    </Panel>
  );
}
