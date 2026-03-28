import { Box } from '@mantine/core';
import { useSessionTerminal } from '@/features/terminal/hooks/useSessionTerminal';
import '@xterm/xterm/css/xterm.css';

interface ClaudeTerminalProps {
  sessionId: string;
}

export function ClaudeTerminal({ sessionId }: ClaudeTerminalProps) {
  const { get } = useSessionTerminal();

  const containerRef = (element: HTMLDivElement | null) => {
    if (!element) return;

    const entry = get(sessionId);
    if (!entry) return;

    element.replaceChildren();
    entry.terminal.open(element);
    entry.fitAddon.fit();
  };

  return <Box ref={containerRef} style={{ flex: 1, overflow: 'hidden' }} />;
}
