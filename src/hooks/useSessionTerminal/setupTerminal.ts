import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';

export const setupTerminal = () => {
  const terminal = new Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: "'JetBrains Mono', monospace",
  });
  const fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);

  return { terminal, fitAddon };
};
