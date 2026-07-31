import './assets/reset.css';

import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import './assets/index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import RootStoreContext, { initializeStore } from './stores/RootStore.ts';

const store = initializeStore();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootStoreContext.Provider value={store}>
      <App />
    </RootStoreContext.Provider>
  </StrictMode>
);
