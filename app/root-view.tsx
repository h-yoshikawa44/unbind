import { renderToString } from 'react-dom/server';
import { serializePage, type RootView } from '@hono/inertia';
import { ReactRefresh, Script, ViteClient } from 'vite-ssr-components/react';

const Document = ({ page }: { page: Parameters<RootView>[0] }) => (
  <html lang="ja">
    <head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" href="/favicon.ico" sizes="32x32" />
      <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.webmanifest" />
      <ViteClient />
      <ReactRefresh />
      <Script src="/src/client.tsx" type="module" />
    </head>
    <body>
      {/* Inertia v3 は script[data-page="app"][type="application/json"] の textContent から初期ページを読む */}
      <script
        data-page="app"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: serializePage(page) }}
      />
      <div id="app" />
    </body>
  </html>
);

export const rootView: RootView = (page) =>
  '<!DOCTYPE html>' + renderToString(<Document page={page} />);
