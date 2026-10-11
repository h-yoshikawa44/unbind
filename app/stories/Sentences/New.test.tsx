import { composeStories } from '@storybook/react-vite';
// テストでは @inertiajs/react がこのモックに差し替わる（vite.config.ts の test.alias）。型もモックとして扱うため直接 import する。
import { router } from '../../../.storybook/mocks/inertia';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import * as stories from './New.stories';

const { Default } = composeStories(stories);

/** 連番の UUID（crypto.randomUUID の戻り値を固定するため）。 */
function uuid(n: number): `${string}-${string}-${string}-${string}-${string}` {
  return `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
}

describe('Sentences/New ページ', () => {
  it('tagSuggestions をタグの入力候補に渡す', () => {
    const { container } = render(<Default />);
    const options = [...container.querySelectorAll('datalist option')].map((o) =>
      o.getAttribute('value'),
    );
    expect(options).toEqual(Default.args.tagSuggestions);
  });

  it('送信すると英文をトークン化して POST /sentences に送る', async () => {
    const user = userEvent.setup();
    let count = 0;
    vi.spyOn(crypto, 'randomUUID').mockImplementation(() => uuid(count++));
    render(<Default />);

    await user.type(screen.getByRole('textbox'), 'Nice to  meet you.');
    await user.type(screen.getByRole('combobox'), 'あいさつ文{Enter}');
    await user.click(screen.getByRole('button', { name: '分解する' }));

    // 1 つ目の UUID が英文 id、以降が各トークンの id になる。
    const sentenceId = uuid(0);
    expect(router.post).toHaveBeenCalledWith('/sentences', {
      id: sentenceId,
      text: 'Nice to  meet you.',
      tokens: ['Nice', 'to', 'meet', 'you.'].map((text, order) => ({
        id: uuid(order + 1),
        sentenceId,
        text,
        order,
        partOfSpeech: null,
        verbForm: null,
        nounForm: null,
        wordMeaning: '',
        idiomMeaning: '',
      })),
      tags: ['あいさつ文'],
    });
  });

  it('キャンセルで一覧へ戻り、送信はしない', async () => {
    const user = userEvent.setup();
    render(<Default />);

    await user.click(screen.getByRole('button', { name: 'キャンセル' }));

    expect(router.visit).toHaveBeenCalledWith('/');
    expect(router.post).not.toHaveBeenCalled();
  });
});
