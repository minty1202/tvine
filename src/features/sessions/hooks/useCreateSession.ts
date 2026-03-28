import { useMutation } from '@tanstack/react-query';
import { createSession } from '@/features/sessions/api/createSession';
import type { CreateSessionValues } from '@/features/sessions/utils/createSessionSchema';

export function useCreateSession() {
  return useMutation({
    mutationFn: (values: CreateSessionValues) => createSession(values),
  });
}
