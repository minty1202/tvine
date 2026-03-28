import { Card, type CardProps } from '@mantine/core';
import type { ReactNode } from 'react';

interface SelectableCardProps extends CardProps {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
}

export function SelectableCard({
  children,
  selected,
  onClick,
  ...rest
}: SelectableCardProps) {
  return (
    <Card
      padding="sm"
      radius="sm"
      bg="dark.7"
      withBorder
      style={{
        cursor: 'pointer',
        transition: 'background 150ms, border-color 150ms',
        borderWidth: 1,
        borderColor: selected ? 'var(--mantine-color-cyan-8)' : undefined,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--mantine-color-dark-6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--mantine-color-dark-7)';
      }}
      onClick={onClick}
      {...rest}
    >
      {children}
    </Card>
  );
}
