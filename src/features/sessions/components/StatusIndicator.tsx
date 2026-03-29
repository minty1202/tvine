import { Text } from '@mantine/core';
import { BrailleSpinner } from '@/components/BrailleSpinner';
import type { SessionStatus } from '@/stores/statusStore';

interface StatusIndicatorProps {
  status: SessionStatus;
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  if (status === 'Busy') {
    return <BrailleSpinner color="var(--mantine-color-green-6)" />;
  }

  if (status === 'Evaluating') {
    return <BrailleSpinner color="var(--mantine-color-dark-3)" />;
  }

  return (
    <Text
      component="span"
      size="md"
      fw={700}
      style={{
        color: 'var(--mantine-color-dark-3)',
        width: 12,
        textAlign: 'center',
        flexShrink: 0,
      }}
    >
      ●
    </Text>
  );
}
