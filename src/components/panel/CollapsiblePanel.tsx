import { Box, Text, ActionIcon, useMantineTheme } from '@mantine/core';
import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Panel } from '@/components/panel/Panel';
import { usePanelState, usePanelStore } from '@/components/panel/store';

const TRANSITION = { duration: 0.2, ease: 'easeInOut' as const };

export interface CollapsiblePanelToggleProps {
  panelKey: string;
  icon: ReactNode;
  defaultOpened?: boolean;
}

function Toggle({ panelKey, icon, defaultOpened }: CollapsiblePanelToggleProps) {
  const isOpen = usePanelState(panelKey, defaultOpened);
  const toggle = usePanelStore((s) => s.toggle);

  return (
    <ActionIcon
      variant={isOpen ? 'light' : 'subtle'}
      size="sm"
      onClick={() => toggle(panelKey)}
      title={panelKey}
    >
      {icon}
    </ActionIcon>
  );
}

function ClosedBar({ icon, title, onClick }: { icon: ReactNode; title: string; onClick: () => void }) {
  return (
    <Box
      c="dimmed"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12, cursor: 'pointer', width: 40, flex: 1 }}
      onClick={onClick}
    >
      {icon}
      <Text size="xs" style={{ writingMode: 'vertical-rl', marginTop: 8, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        {title}
      </Text>
    </Box>
  );
}

function OpenedContent({ icon, title, children, onClose }: { icon: ReactNode; title: string; children: ReactNode; onClose: () => void }) {
  return (
    <Panel style={{ flex: 1 }}>
      <Panel.Header gap={8} c="dimmed" style={{ cursor: 'pointer' }} onClick={onClose}>
        {icon}
        <Text size="xs" fw={600} tt="uppercase">{title}</Text>
      </Panel.Header>
      {children}
    </Panel>
  );
}

export interface CollapsiblePanelProps {
  panelKey: string;
  title: string;
  icon: ReactNode;
  defaultOpened?: boolean;
  children: ReactNode;
  bg?: string;
}

function CollapsiblePanelRoot({
  panelKey,
  title,
  icon,
  defaultOpened,
  children,
  bg,
}: CollapsiblePanelProps) {
  const theme = useMantineTheme();
  const opened = usePanelState(panelKey, defaultOpened);
  const open = usePanelStore((s) => s.open);
  const close = usePanelStore((s) => s.close);

  const [colorName, shade] = bg?.split('.') ?? [];
  const backgroundColor = bg ? theme.colors[colorName]?.[Number(shade)] : undefined;

  return (
    <motion.div
      animate={{ width: opened ? '20vw' : 40, minWidth: opened ? 200 : 40 }}
      transition={TRANSITION}
      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0, backgroundColor }}
    >
      {opened
        ? <OpenedContent icon={icon} title={title} onClose={() => close(panelKey)}>{children}</OpenedContent>
        : <ClosedBar icon={icon} title={title} onClick={() => open(panelKey)} />
      }
    </motion.div>
  );
}

export const CollapsiblePanel = Object.assign(CollapsiblePanelRoot, {
  Toggle,
});
