import { Box, Text, ActionIcon, type BoxProps } from '@mantine/core';
import { type ReactNode } from 'react';
import { Panel } from '@/components/Panel';

export interface CollapsiblePanelProps {
  opened: boolean;
  onOpen: () => void;
  onClose: () => void;
  title: string;
  icon: string;
  children: ReactNode;
  openedProps?: BoxProps;
  closedProps?: BoxProps;
}

export function CollapsiblePanel({
  opened,
  onOpen,
  onClose,
  title,
  icon,
  children,
  openedProps,
  closedProps,
}: CollapsiblePanelProps) {
  if (!opened) {
    return (
      <Box
        w={40}
        miw={40}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12, cursor: 'pointer' }}
        onClick={onOpen}
        {...closedProps}
      >
        <Text size="xs" c="dimmed">{icon}</Text>
        <Text size="xs" c="dimmed" style={{ writingMode: 'vertical-rl', marginTop: 8, letterSpacing: 1, textTransform: 'uppercase' }}>
          {title}
        </Text>
      </Box>
    );
  }

  return (
    <Panel w="20vw" miw={200} {...openedProps}>
      <Panel.Header gap={8}>
        <ActionIcon variant="subtle" size="xs" onClick={onClose}>
          <Text size="xs">✕</Text>
        </ActionIcon>
        <Text size="xs" fw={600} c="dimmed" tt="uppercase">{title}</Text>
      </Panel.Header>
      {children}
    </Panel>
  );
}
