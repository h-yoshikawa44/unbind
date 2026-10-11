import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Storybook 専用の Vite 設定。
// ルートの vite.config.ts のうち React の描画に必要な部分（react プラグイン・@ エイリアス）だけを持つ。
export default defineConfig({
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('../src', import.meta.url)) },
      // Inertia のクライアントルータはサーバ（Hono）が無いと動かないため、モックに差し替える。
      {
        find: /^@inertiajs\/react$/,
        replacement: fileURLToPath(new URL('./mocks/inertia.tsx', import.meta.url)),
      },
    ],
  },
  plugins: [react()],
});
