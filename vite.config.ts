import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.OPENROUTER_API_KEY),
        'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY),
        'process.env.OPENROUTER_MODEL': JSON.stringify(env.OPENROUTER_MODEL),
        'process.env.OPENROUTER_VISION_MODEL': JSON.stringify(env.OPENROUTER_VISION_MODEL),
        'process.env.OPENROUTER_IMAGE_MODEL': JSON.stringify(env.OPENROUTER_IMAGE_MODEL),
        'process.env.DEMO_MODE': JSON.stringify(env.DEMO_MODE)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      }
    };
});
