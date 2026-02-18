import { Box, Flex, Divider, type BoxProps, type FlexProps } from '@mantine/core';
import { type ReactNode } from 'react';
import { layout } from '@/config/theme/tokens';

// Panel (root)
export interface PanelProps extends BoxProps {
  children: ReactNode;
}

function PanelRoot({ children, style: styleProp, ...rest }: PanelProps) {
  return (
    <Box
      style={(theme) => ({
        display: 'flex',
        flexDirection: 'column' as const,
        ...(typeof styleProp === 'function' ? styleProp(theme) : styleProp),
      })}
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

function PanelHeader({ children, style: styleProp, ...rest }: PanelHeaderProps) {
  return (
    <Flex
      h={layout.headerHeight}
      px={layout.headerPaddingX}
      align="center"
      style={(theme) => ({
        borderBottom: `1px solid ${theme.colors.dark[4]}`,
        ...(typeof styleProp === 'function' ? styleProp(theme) : styleProp),
      })}
      {...rest}
    >
      {children}
    </Flex>
  );
}

// Panel.Divider
// color prop を使用（Mantine コンポーネントのため）。PanelHeader は CSS borderBottom のため theme.colors で参照。
function PanelDivider() {
  return <Divider orientation="vertical" color="dark.4" />;
}

export const Panel = Object.assign(PanelRoot, {
  Header: PanelHeader,
  Divider: PanelDivider,
});
