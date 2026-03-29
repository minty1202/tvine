import { atom } from 'jotai';

type SessionStatus = 'Busy' | 'Evaluating' | 'Idle';

const statusMapAtom = atom<Map<string, SessionStatus>>(new Map());

export { statusMapAtom };
export type { SessionStatus };
