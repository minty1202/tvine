import { Flex, Box, Text } from '@mantine/core';
import { IconFileDiff, IconTerminal2 } from '@tabler/icons-react';
import { Panel } from '@/components/panel/Panel';
import { CollapsiblePanel } from '@/components/panel/CollapsiblePanel';

const ICON_SIZE = 16;

export function Layout() {
  return (
    <Flex h="100vh" style={{ overflow: 'hidden' }}>
      {/* Sidebar */}
      <Panel w="15vw" miw={200} bg="dark.8">
        <Panel.Header justify="space-between">
          <Text size="xs" fw={600} c="dimmed" tt="uppercase">Worktrees</Text>
        </Panel.Header>
        <Box p={8}>Sidebar content</Box>
      </Panel>

      <Panel.Divider />

      {/* Main - Claude Terminal */}
      <Panel style={{ flex: 1, minWidth: 0 }}>
        <Panel.Header gap={10} bg="dark.8">
          <CollapsiblePanel.Toggle panelKey="changes" icon={<IconFileDiff size={ICON_SIZE} />} defaultOpened />
          <CollapsiblePanel.Toggle panelKey="terminal" icon={<IconTerminal2 size={ICON_SIZE} />} />
          <Text size="xs" c="dimmed">feature/login</Text>
        </Panel.Header>
        <Box bg="dark.9" style={{ flex: 1, padding: 12 }}>
          <Text size="sm" c="dimmed">Terminal area</Text>
        </Box>
      </Panel>

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
          <Text size="xs" c="dimmed">Diff preview</Text>
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
          <Text size="xs" c="dimmed">Terminal content</Text>
        </Box>
      </CollapsiblePanel>
    </Flex>
  );
}
