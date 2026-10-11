import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  // ページのストーリーは app/pages の外（app/stories）に置く。
  // app/pages 配下に置くと inertiaPages() が pages.gen.ts のページ名として拾い、
  // src/client.tsx の import.meta.glob でクライアントバンドルにも含まれてしまうため。
  stories: ['../src/**/*.stories.@(ts|tsx)', '../app/stories/**/*.stories.@(ts|tsx)'],
  framework: {
    name: '@storybook/react-vite',
    options: {
      builder: {
        // ルートの vite.config.ts は Hono の dev サーバ（Miniflare）や SSR 用プラグインを含むため、
        // Storybook 専用の最小構成を使う。
        viteConfigPath: '.storybook/vite.config.ts',
      },
    },
  },
};

export default config;
