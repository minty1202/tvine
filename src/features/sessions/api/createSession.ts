import { invoke } from '@tauri-apps/api/core';

export type CreateSessionParams = {
  baseBranch: string;
  branchName: string;
};

export type Session = {
  id: string;
  branch_name: string;
  base_branch: string;
  worktree_path: string;
  created_at: string;
};

export function createSession(params: CreateSessionParams): Promise<Session> {
  return invoke<Session>('create_session', params);
}
