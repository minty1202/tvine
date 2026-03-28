import { Box, Text } from '@mantine/core';
import { IconFileDiff } from '@tabler/icons-react';
import { CollapsiblePanel } from '@/components/panel/CollapsiblePanel';

const PANEL_KEY = 'changes';
const ICON_SIZE = 16;
const ICON = <IconFileDiff size={ICON_SIZE} />;

export function DiffPanelToggle() {
  return (
    <CollapsiblePanel.Toggle panelKey={PANEL_KEY} icon={ICON} defaultOpened />
  );
}

export function DiffPanel() {
  return (
    <CollapsiblePanel
      panelKey={PANEL_KEY}
      title="Changes"
      icon={ICON}
      defaultOpened
      bg="dark.8"
    >
      <Box p={8} style={{ flex: 1 }}>
        <Text size="xs" c="dimmed">
          Diff preview
        </Text>
      </Box>
    </CollapsiblePanel>
  );
}
