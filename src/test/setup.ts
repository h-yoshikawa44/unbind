import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { setProjectAnnotations } from '@storybook/react-vite';
import { clearAllMocks } from 'storybook/test';
import { afterEach, vi } from 'vite-plus/test';
import preview from '../../.storybook/preview';

// composeStories で取り出したストーリーにも .storybook/preview.ts の設定（グローバル CSS 等）を適用する。
setProjectAnnotations(preview);

// jsdom は <dialog> の showModal / close を実装していないため、open 属性の切り替えと close イベントだけ補う。
// （閉じた <dialog> は jsdom の既定スタイルで display: none になるので、role での検索からも外れる）
HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.open = true;
};
HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
  if (!this.open) return;
  this.open = false;
  this.dispatchEvent(new Event('close'));
};
// scrollIntoView も jsdom には無い（レイアウトを持たないので何もしなくてよい）。
Element.prototype.scrollIntoView = function scrollIntoView() {};

afterEach(() => {
  cleanup();
  // ストーリーの args や router モックの fn() はモジュール単位で共有されるため、テストごとに呼び出し履歴を消す。
  clearAllMocks();
  // Index ページは URL クエリに絞り込み状態を書き戻すので、次のテストに持ち越さない。
  window.history.replaceState({}, '', '/');
  // テスト内で vi.spyOn した window.confirm 等を元に戻す。
  vi.restoreAllMocks();
});
