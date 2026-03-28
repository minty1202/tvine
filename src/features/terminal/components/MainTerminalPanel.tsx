import { useAtomValue } from 'jotai';
import { Panel } from '@/components/panel/Panel';
import { TerminalContent } from '@/features/terminal/components/TerminalContent';
import { TerminalHeader } from '@/features/terminal/components/TerminalHeader';
import { selectedSessionIdAtom } from '@/stores/sessionStore';

export function MainTerminalPanel() {
  const selectedSessionId = useAtomValue(selectedSessionIdAtom);

  return (
    <Panel style={{ flex: 1, minWidth: 0 }}>
      <TerminalHeader sessionId={selectedSessionId} />
      <TerminalContent sessionId={selectedSessionId} />
    </Panel>
  );
}
