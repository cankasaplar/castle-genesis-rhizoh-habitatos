import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const raw = env.VITE_FIREBASE_CONFIG || '{}';
  return {
    plugins: [react()],
    define: {
      __firebase_config: JSON.stringify(raw),
    },
  };
});
