import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { api } from './api/client.ts';
import { App } from './app/App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App api={api} />
  </StrictMode>,
);
