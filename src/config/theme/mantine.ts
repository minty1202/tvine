import { createTheme } from '@mantine/core';

const FONT_MONO = "'JetBrains Mono', 'Hiragino Sans', monospace";

export const theme = createTheme({
  primaryColor: 'cyan',
  defaultRadius: 'sm',
  fontFamily: "'Hiragino Sans', sans-serif",
  fontFamilyMonospace: FONT_MONO,
  colors: {
    dark: [
      '#c8cee0', // 0: bright text
      '#a0a8c4', // 1: primary text
      '#7880a0', // 2: secondary text
      '#5a6080', // 3: muted text
      '#3d4259', // 4: borders
      '#33374d', // 5: subtle borders
      '#2a2d40', // 6: hover / elevated
      '#222536', // 7: panel bg
      '#1a1d2e', // 8: main bg
      '#131520', // 9: deepest bg
    ],
  },
});
