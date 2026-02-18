import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
import { theme } from '@/config/theme/mantine';
import { Layout } from '@/app/Layout';

function App() {
  return (
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      <Layout />
    </MantineProvider>
  );
}

export default App;
