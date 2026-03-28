import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '@/app/Layout';
import { theme } from '@/config/theme/mantine';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider defaultColorScheme="dark" theme={theme}>
        <Layout />
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;
