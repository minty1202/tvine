import { Box, Text } from '@mantine/core';
import { IconTerminal2 } from '@tabler/icons-react';
import { CollapsiblePanel } from '@/components/panel/CollapsiblePanel';

const PANEL_KEY = 'terminal';
const ICON_SIZE = 16;
const ICON = <IconTerminal2 size={ICON_SIZE} />;

export function ShellPanelToggle() {
  return <CollapsiblePanel.Toggle panelKey={PANEL_KEY} icon={ICON} />;
}

export function ShellPanel() {
  return (
    <CollapsiblePanel
      panelKey={PANEL_KEY}
      title="Terminal"
      icon={ICON}
      bg="dark.9"
    >
      <Box p={12} style={{ flex: 1 }}>
        <Text size="xs" c="dimmed">
          Terminal content
        </Text>
      </Box>
    </CollapsiblePanel>
  );
}
