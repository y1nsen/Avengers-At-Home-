import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isHttps = mode === 'https';

  return {
    publicDir: 'public',
    plugins: isHttps ? [basicSsl()] : [],
    server: {
      port: 3000,
      host: '0.0.0.0',
      cors: true,
      https: isHttps
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  };
});
