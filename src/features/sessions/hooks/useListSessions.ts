import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import { listSessions } from '@/features/sessions/api/listSessions';

export function useListSessions() {
  return useQuery({
    queryKey: queryKeys.sessions,
    queryFn: listSessions,
  });
}
