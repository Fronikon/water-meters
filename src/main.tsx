import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import App from './App.tsx';
import RootStoreContext, { initializeStore } from './stores/RootStore.ts';
import theme from './theme/theme.ts';

const store = initializeStore();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootStoreContext.Provider value={store}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </RootStoreContext.Provider>
  </StrictMode>
);
