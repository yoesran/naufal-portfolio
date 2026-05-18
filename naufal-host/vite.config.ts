import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'host',
      remotes: {
        lab: {
          type: 'module',
          name: 'lab',
          entry: 'http://localhost:5174/remoteEntry.js',
        },
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  server: { port: 5173 },
  build: { target: 'chrome89' },
});
