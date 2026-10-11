import { composeStories } from '@storybook/react-vite';
// テストでは @inertiajs/react がこのモックに差し替わる（vite.config.ts の test.alias）。型もモックとして扱うため直接 import する。
import { router } from '../../../.storybook/mocks/inertia';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import { analyzedSentence, idiomSentence } from '@/fixtures/sentences';
import * as stories from './Show.stories';

const { Analyzed, WithIdiom, NotFound } = composeStories(stories);

describe('Sentences/Show ページ', () => {
  it('sentence と tagSuggestions をエディタに渡して表示する', () => {
    const { container } = render(<Analyzed />);
    expect(screen.getByText(analyzedSentence.text)).toBeInTheDocument();
    expect(screen.getByLabelText('意訳')).toHaveValue(analyzedSentence.naturalTranslation);
    const options = [...container.querySelectorAll('datalist option')].map((o) =>
      o.getAttribute('value'),
    );
    // 付与済みのタグは候補から除外される。
    expect(options).toEqual(['あいさつ文']);
  });

  it('保存すると編集内容を PUT /sentences/:id に送る', async () => {
    const user = userEvent.setup();
    render(<Analyzed />);

    const translation = screen.getByLabelText('意訳');
    await user.clear(translation);
    await user.type(translation, '辞書で単語を調べた。');
    await user.click(screen.getByRole('button', { name: '保存' }));

    expect(router.put).toHaveBeenCalledWith(`/sentences/${analyzedSentence.id}`, {
      tokens: analyzedSentence.tokens,
      idioms: analyzedSentence.idioms,
      naturalTranslation: '辞書で単語を調べた。',
      tags: analyzedSentence.tags,
    });
  });

  it('慣用句の編集内容も PUT /sentences/:id に送る', async () => {
    const user = userEvent.setup();
    render(<WithIdiom />);

    await user.click(screen.getByRole('button', { name: '慣用句「turn … off.」を編集' }));
    const meaning = screen.getByLabelText('慣用句としての意味');
    await user.clear(meaning);
    await user.type(meaning, '消す');
    await user.click(screen.getByRole('button', { name: '保存' }));

    expect(router.put).toHaveBeenCalledWith(`/sentences/${idiomSentence.id}`, {
      tokens: idiomSentence.tokens,
      idioms: [{ ...idiomSentence.idioms[0], meaning: '消す' }],
      naturalTranslation: idiomSentence.naturalTranslation,
      tags: idiomSentence.tags,
    });
  });

  it('戻るで一覧へ遷移する', async () => {
    const user = userEvent.setup();
    render(<Analyzed />);

    await user.click(screen.getByRole('button', { name: '← 戻る' }));

    expect(router.visit).toHaveBeenCalledWith('/');
  });

  it('sentence が null なら「見つかりません」を表示し、エディタは出さない', () => {
    render(<NotFound />);
    expect(screen.getByText('英文が見つかりません')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '保存' })).not.toBeInTheDocument();
  });
});
