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

    // terminal.open() は1回しか呼べないので、初回のみ実行
    if (!entry.terminal.element) {
      entry.terminal.open(element);
    } else {
      // 既に open 済みの場合は DOM ノードを移動する
      element.replaceChildren();
      element.appendChild(entry.terminal.element);
    }
    entry.fitAddon.fit();
  };

  return <Box ref={containerRef} style={{ flex: 1, overflow: 'hidden' }} />;
}
