import { Flex } from '@mantine/core';
import { Panel } from '@/components/panel/Panel';
// TODO: diff・shell パネルは未実装
// import {
//   DiffPanel,
//   DiffPanelToggle,
// } from '@/features/diff/components/DiffPanel';
import { SessionSidebar } from '@/features/sessions/components/SessionSidebar';
// import {
//   ShellPanel,
//   ShellPanelToggle,
// } from '@/features/shell/components/ShellPanel';
import { MainTerminalPanel } from '@/features/terminal/components/MainTerminalPanel';

export function Layout() {
  return (
    <Flex h="100vh" style={{ overflow: 'hidden' }}>
      <SessionSidebar />

      <Panel.Divider />

      <MainTerminalPanel
      // panelToggles={
      //   <>
      //     <DiffPanelToggle />
      //     <ShellPanelToggle />
      //   </>
      // }
      />
    </Flex>
  );
}
