import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { setProjectAnnotations } from '@storybook/react-vite';
import { clearAllMocks } from 'storybook/test';
import { afterEach, vi } from 'vite-plus/test';
import preview from '../../.storybook/preview';

// composeStories で取り出したストーリーにも .storybook/preview.ts の設定（グローバル CSS 等）を適用する。
setProjectAnnotations(preview);

afterEach(() => {
  cleanup();
  // ストーリーの args に入っている fn() はモジュール単位で共有されるため、テストごとに呼び出し履歴を消す。
  clearAllMocks();
  // テスト内で vi.spyOn した window.confirm 等を元に戻す。
  vi.restoreAllMocks();
});
