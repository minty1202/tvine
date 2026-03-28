import type { UnlistenFn } from '@tauri-apps/api/event';
import type { FitAddon } from '@xterm/addon-fit';
import type { Terminal } from '@xterm/xterm';
import { atom } from 'jotai';

type TerminalEntry = {
  terminal: Terminal;
  fitAddon: FitAddon;
  unlisten: UnlistenFn;
};

const terminalsAtom = atom<Map<string, TerminalEntry>>(new Map());
const exitedSessionsAtom = atom(new Set<string>());

export { exitedSessionsAtom, terminalsAtom };
export type { TerminalEntry };
