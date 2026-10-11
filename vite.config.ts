import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite-plus';
import react from '@vitejs/plugin-react';
import devServer from '@hono/vite-dev-server';
import cloudflareAdapter from '@hono/vite-dev-server/cloudflare';
import cloudflareWorkersBuild from '@hono/vite-build/cloudflare-workers';
import { inertiaPages } from '@hono/inertia/vite';
import ssrPlugin from 'vite-ssr-components/plugin';

// クライアントビルドが出力する manifest のパス（サーバビルド時に読み込む）。
const CLIENT_MANIFEST = './dist/.vite/manifest.json';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // mode=server のときだけ Hono サーバを Node 向けにビルドする。
  const isServerBuild = command === 'build' && mode === 'server';

  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    lint: {
      options: { typeAware: true, typeCheck: true },
      plugins: ['react', 'typescript'],
      categories: {
        correctness: 'error',
        suspicious: 'warn',
      },
      env: {
        browser: true,
        es2020: true,
      },
      rules: {
        // 明示的な React インポートは不要なのでオフ
        'react/react-in-jsx-scope': 'off',
      },
      // generated/** は cmk、app/pages.gen.ts は @hono/inertia/vite の自動生成物
      ignorePatterns: [
        'generated/**',
        'app/pages.gen.ts',
        'dist/**',
        'dist-server/**',
        'storybook-static/**',
      ],
    },
    fmt: {
      singleQuote: true,
      ignorePatterns: [
        'generated/**',
        'app/pages.gen.ts',
        'dist/**',
        'dist-server/**',
        'storybook-static/**',
      ],
    },
    staged: {
      '*': 'vp check --fix',
    },
    // 本番では vite-ssr-components の <Script> がこの define からハッシュ付き asset を解決する。
    define: isServerBuild
      ? {
          'import.meta.env.VITE_MANIFEST_CONTENT': JSON.stringify(
            readFileSync(CLIENT_MANIFEST, 'utf-8'),
          ),
        }
      : {},
    plugins: [
      react(),
      inertiaPages(),
      ...(isServerBuild
        ? [
            // Hono アプリを Cloudflare Workers 向けにビルドし、dist-server/index.js を生成する。
            // 静的資産（/assets/* 等）は wrangler.jsonc の assets バインディングで dist から配信する。
            cloudflareWorkersBuild({
              entry: 'app/server.tsx',
              outputDir: './dist-server',
            }),
          ]
        : [
            // dev のみ Hono を Vite ミドルウェアとして実行する。
            // cloudflare アダプタで Miniflare 経由の KV バインディング（c.env）を注入する。
            ...(command === 'serve'
              ? [
                  devServer({
                    entry: 'app/server.tsx',
                    injectClientScript: false,
                    adapter: cloudflareAdapter,
                  }),
                ]
              : []),
            // クライアントビルド / dev の資産解決を担う。
            ...ssrPlugin(),
          ]),
    ],
  };
});
