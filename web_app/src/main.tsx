import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { api } from './api/client.ts';
import { App } from './app/App.tsx';
import { PLAYGROUND_PATH } from './playground/protocol.ts';

const root = document.getElementById('root')!;

if (window.location.pathname === PLAYGROUND_PATH) {
  // The landing page's interactive example (B-02 V11): the real app on an in-memory example garden.
  void import('./playground/PlaygroundApp.tsx').then(({ bootPlayground }) => bootPlayground(root));
} else {
  createRoot(root).render(
    <StrictMode>
      <App api={api} />
    </StrictMode>,
  );
}
