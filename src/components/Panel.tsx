import { Box, Flex, Divider, type BoxProps, type FlexProps } from '@mantine/core';
import { type ReactNode } from 'react';
import { layout } from '@/config/theme/tokens';

// Panel (root)
export interface PanelProps extends BoxProps {
  children: ReactNode;
}

function PanelRoot({ children, style, ...rest }: PanelProps) {
  return (
    <Box
      style={{ display: 'flex', flexDirection: 'column', ...style }}
      {...rest}
    >
      {children}
    </Box>
  );
}

// Panel.Header
export interface PanelHeaderProps extends Omit<FlexProps, 'h' | 'px' | 'align'> {
  children: ReactNode;
}

function PanelHeader({ children, ...rest }: PanelHeaderProps) {
  return (
    <Flex
      h={layout.headerHeight}
      px={layout.headerPaddingX}
      align="center"
      style={{ borderBottom: '1px solid var(--mantine-color-dark-4)' }}
      {...rest}
    >
      {children}
    </Flex>
  );
}

// Panel.Divider
function PanelDivider() {
  return <Divider orientation="vertical" color="dark.4" />;
}

export const Panel = Object.assign(PanelRoot, {
  Header: PanelHeader,
  Divider: PanelDivider,
});
