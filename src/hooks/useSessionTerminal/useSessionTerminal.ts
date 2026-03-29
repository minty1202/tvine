import { useAtom, useSetAtom } from 'jotai';
import { statusMapAtom } from '@/stores/statusStore';
import {
  exitedSessionsAtom,
  type TerminalEntry,
  terminalsAtom,
} from '@/stores/terminalStore';
import { makeCreate } from './makeCreate';
import { makeRemove } from './makeRemove';

export const useSessionTerminal = () => {
  const [terminals, setTerminals] = useAtom(terminalsAtom);
  const [exitedSessions, setExitedSessions] = useAtom(exitedSessionsAtom);
  const setStatusMap = useSetAtom(statusMapAtom);

  const get = (sessionId: string): TerminalEntry | undefined =>
    terminals.get(sessionId);

  const isExited = (sessionId: string): boolean =>
    exitedSessions.has(sessionId);

  const remove = makeRemove({
    terminals,
    setTerminals,
    setExitedSessions,
    setStatusMap,
  });

  const create = makeCreate({
    terminals,
    exitedSessions,
    setTerminals,
    setExitedSessions,
    setStatusMap,
    cleanup: remove,
  });

  return { get, create, remove, isExited };
};
