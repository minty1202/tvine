import { invoke } from '@tauri-apps/api/core';

export type CreateSessionParams = {
  baseBranch: string;
  branchName: string;
};

export function createSession(params: CreateSessionParams): Promise<void> {
  return invoke('create_session', params);
}
