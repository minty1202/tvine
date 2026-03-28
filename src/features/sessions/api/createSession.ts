import { invoke } from '@tauri-apps/api/core';
import type { Session } from '@/generated/Session';

export type CreateSessionParams = {
  baseBranch: string;
  branchName: string;
};

export function createSession(params: CreateSessionParams): Promise<Session> {
  return invoke<Session>('create_session', params);
}
