import { Flex } from '@mantine/core';
import { Panel } from '@/components/panel/Panel';
import { DiffPanel } from '@/features/diff/components/DiffPanel';
import { SessionSidebar } from '@/features/sessions/components/SessionSidebar';
import { ShellPanel } from '@/features/shell/components/ShellPanel';
import { MainTerminalPanel } from '@/features/terminal/components/MainTerminalPanel';

export function Layout() {
  return (
    <Flex h="100vh" style={{ overflow: 'hidden' }}>
      <SessionSidebar />

      <Panel.Divider />

      <MainTerminalPanel />

      <Panel.Divider />

      <DiffPanel />

      <Panel.Divider />

      <ShellPanel />
    </Flex>
  );
}
