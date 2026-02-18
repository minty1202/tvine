import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
import { Layout } from '@/app/Layout';
import { theme } from '@/config/theme/mantine';

function App() {
  return (
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      <Layout />
    </MantineProvider>
  );
}

export default App;
