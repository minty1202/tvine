import { Flex, Box, Text, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Panel } from '@/components/panel/Panel';
import { CollapsiblePanel } from '@/components/panel/CollapsiblePanel';

export function Layout() {
  const [changesOpened, changesHandlers] = useDisclosure(true);
  const [terminalOpened, terminalHandlers] = useDisclosure(false);

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
          <ActionIcon
            variant={changesOpened ? 'light' : 'subtle'}
            size="sm"
            onClick={changesHandlers.toggle}
            title="Changes"
          >
            <Text size="xs">C</Text>
          </ActionIcon>
          <ActionIcon
            variant={terminalOpened ? 'light' : 'subtle'}
            size="sm"
            onClick={terminalHandlers.toggle}
            title="Terminal"
          >
            <Text size="xs">T</Text>
          </ActionIcon>
          <Text size="xs" c="dimmed">feature/login</Text>
        </Panel.Header>
        <Box bg="dark.9" style={{ flex: 1, padding: 12 }}>
          <Text size="sm" c="dimmed">Terminal area</Text>
        </Box>
      </Panel>

      <Panel.Divider />

      {/* Changes */}
      <CollapsiblePanel
        opened={changesOpened}
        onOpen={changesHandlers.open}
        onClose={changesHandlers.close}
        title="Changes"
        icon="C"
        openedProps={{ bg: 'dark.8' }}
        closedProps={{ bg: 'dark.8' }}
      >
        <Box p={8} style={{ flex: 1 }}>
          <Text size="xs" c="dimmed">Diff preview</Text>
        </Box>
      </CollapsiblePanel>

      <Panel.Divider />

      {/* Terminal */}
      <CollapsiblePanel
        opened={terminalOpened}
        onOpen={terminalHandlers.open}
        onClose={terminalHandlers.close}
        title="Terminal"
        icon="T"
        openedProps={{ bg: 'dark.9' }}
        closedProps={{ bg: 'dark.9' }}
      >
        <Box p={12} style={{ flex: 1 }}>
          <Text size="xs" c="dimmed">Terminal content</Text>
        </Box>
      </CollapsiblePanel>
    </Flex>
  );
}
