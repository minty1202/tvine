import { createSession } from '@/features/sessions/api/createSession';
import type { CreateSessionValues } from '@/features/sessions/utils/createSessionSchema';

export function useCreateSession() {
  const handleCreateSession = async (values: CreateSessionValues) => {
    await createSession(values);
  };

  return { createSession: handleCreateSession };
}
