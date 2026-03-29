import { Box } from '@mantine/core';
import { useSessionTerminal } from '@/hooks/useSessionTerminal/useSessionTerminal';
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

    if (!entry.terminal.element) {
      entry.terminal.open(element);
    } else {
      element.replaceChildren();
      element.appendChild(entry.terminal.element);
    }
    entry.fitAddon.fit();

    const observer = new ResizeObserver(() => {
      entry.fitAddon.fit();
    });
    observer.observe(element);

    return () => observer.disconnect();
  };

  return <Box ref={containerRef} style={{ flex: 1, overflow: 'hidden' }} />;
}
