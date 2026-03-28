import { Box, Flex, Text } from '@mantine/core';
import { IconFileDiff, IconTerminal2 } from '@tabler/icons-react';
import { CollapsiblePanel } from '@/components/panel/CollapsiblePanel';
import { Panel } from '@/components/panel/Panel';
import { SessionSidebar } from '@/features/sessions/components/SessionSidebar';
import { MainTerminalPanel } from '@/features/terminal/components/MainTerminalPanel';

const ICON_SIZE = 16;

export function Layout() {
  return (
    <Flex h="100vh" style={{ overflow: 'hidden' }}>
      <SessionSidebar />

      <Panel.Divider />

      <MainTerminalPanel />

      <Panel.Divider />

      {/* Changes */}
      <CollapsiblePanel
        panelKey="changes"
        title="Changes"
        icon={<IconFileDiff size={ICON_SIZE} />}
        defaultOpened
        bg="dark.8"
      >
        <Box p={8} style={{ flex: 1 }}>
          <Text size="xs" c="dimmed">
            Diff preview
          </Text>
        </Box>
      </CollapsiblePanel>

      <Panel.Divider />

      {/* Terminal */}
      <CollapsiblePanel
        panelKey="terminal"
        title="Terminal"
        icon={<IconTerminal2 size={ICON_SIZE} />}
        bg="dark.9"
      >
        <Box p={12} style={{ flex: 1 }}>
          <Text size="xs" c="dimmed">
            Terminal content
          </Text>
        </Box>
      </CollapsiblePanel>
    </Flex>
  );
}
