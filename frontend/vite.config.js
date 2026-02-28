import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
// Note: No proxy needed — nginx routes /api → backend in the Docker setup.
export default defineConfig({
  plugins: [react()],
});
