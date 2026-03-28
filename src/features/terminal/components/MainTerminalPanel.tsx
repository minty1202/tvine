import { useAtomValue } from 'jotai';
import type { ReactNode } from 'react';
import { Panel } from '@/components/panel/Panel';
import { TerminalContent } from '@/features/terminal/components/TerminalContent';
import { TerminalHeader } from '@/features/terminal/components/TerminalHeader';
import { selectedSessionIdAtom } from '@/stores/sessionStore';

interface MainTerminalPanelProps {
  panelToggles?: ReactNode;
}

export function MainTerminalPanel({ panelToggles }: MainTerminalPanelProps) {
  const selectedSessionId = useAtomValue(selectedSessionIdAtom);

  return (
    <Panel style={{ flex: 1, minWidth: 0 }}>
      <TerminalHeader
        sessionId={selectedSessionId}
        panelToggles={panelToggles}
      />
      <TerminalContent sessionId={selectedSessionId} />
    </Panel>
  );
}
