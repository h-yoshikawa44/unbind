import { composeStories } from '@storybook/react-vite';
// テストでは @inertiajs/react がこのモックに差し替わる（vite.config.ts の test.alias）。型もモックとして扱うため直接 import する。
import { router } from '../../../.storybook/mocks/inertia';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { Sentence } from '@/types';
import { analyzedSentence, unanalyzedSentence } from '@/fixtures/sentences';
import * as stories from './Index.stories';

const { Default } = composeStories(stories);

/** 表示中の英文（本文）の一覧。 */
function visibleTexts(): string[] {
  return screen.queryAllByRole('button', { name: '削除' }).map((button) => {
    const text = button.parentElement?.querySelector('p')?.textContent;
    if (!text) throw new Error('英文の本文が見つかりません');
    return text;
  });
}

/** 現在の URL クエリの値。 */
function query(key: string): string | null {
  return new URLSearchParams(window.location.search).get(key);
}

/** ページング確認用に n 件の英文を作る。 */
function manySentences(n: number): Sentence[] {
  return Array.from({ length: n }, (_, i) => ({
    ...unanalyzedSentence,
    id: `n${i + 1}`,
    text: `Sentence ${i + 1}.`,
  }));
}

describe('Sentences/Index ページ', () => {
  it('props の英文とタグを一覧に表示する', () => {
    render(<Default />);
    expect(visibleTexts()).toEqual([analyzedSentence.text, unanalyzedSentence.text]);
    for (const tag of Default.args.allTags ?? []) {
      expect(screen.getByRole('button', { name: tag, pressed: false })).toBeInTheDocument();
    }
  });

  describe('絞り込み', () => {
    it('タグを選ぶと、そのタグを持つ英文だけを表示して URL に反映する', async () => {
      const user = userEvent.setup();
      render(<Default />);

      await user.click(screen.getByRole('button', { name: 'あいさつ文' }));

      expect(visibleTexts()).toEqual([unanalyzedSentence.text]);
      expect(screen.getByRole('button', { name: 'あいさつ文', pressed: true })).toBeInTheDocument();
      expect(query('tags')).toBe('あいさつ文');
    });

    it('複数のタグはすべてを持つ英文だけに絞る（AND）', async () => {
      const user = userEvent.setup();
      render(<Default />);

      await user.click(screen.getByRole('button', { name: '過去文' }));
      await user.click(screen.getByRole('button', { name: '句動詞' }));
      expect(visibleTexts()).toEqual([analyzedSentence.text]);

      await user.click(screen.getByRole('button', { name: 'あいさつ文' }));
      expect(visibleTexts()).toEqual([]);
      expect(screen.getByText('絞り込み条件に一致する英文はありません。')).toBeInTheDocument();
    });

    it('選択中のタグをもう一度押すと解除する', async () => {
      const user = userEvent.setup();
      render(<Default />);

      await user.click(screen.getByRole('button', { name: 'あいさつ文' }));
      await user.click(screen.getByRole('button', { name: 'あいさつ文' }));

      expect(visibleTexts()).toHaveLength(2);
      expect(window.location.search).toBe('');
    });

    it('キーワードは英文・和訳を大文字小文字を区別せずに検索し、URL に反映する', async () => {
      const user = userEvent.setup();
      render(<Default />);

      await user.type(screen.getByRole('searchbox'), 'NICE');
      expect(visibleTexts()).toEqual([unanalyzedSentence.text]);
      expect(query('q')).toBe('NICE');

      await user.clear(screen.getByRole('searchbox'));
      await user.type(screen.getByRole('searchbox'), '辞書');
      expect(visibleTexts()).toEqual([analyzedSentence.text]);
    });

    it('空白区切りのキーワードはすべてを含む英文だけに絞る（AND）', async () => {
      const user = userEvent.setup();
      render(<Default />);

      await user.type(screen.getByRole('searchbox'), 'nice you');
      expect(visibleTexts()).toEqual([unanalyzedSentence.text]);

      await user.type(screen.getByRole('searchbox'), ' dictionary');
      expect(visibleTexts()).toEqual([]);
    });

    it('クリアでタグ・キーワードを解除し、URL も戻す', async () => {
      const user = userEvent.setup();
      render(<Default />);

      await user.click(screen.getByRole('button', { name: '過去文' }));
      await user.type(screen.getByRole('searchbox'), 'looked');
      await user.click(screen.getByRole('button', { name: 'クリア' }));

      expect(visibleTexts()).toHaveLength(2);
      expect(screen.getByRole('searchbox')).toHaveValue('');
      expect(window.location.search).toBe('');
    });

    it('URL クエリの絞り込み条件を初期状態として復元する', () => {
      window.history.replaceState({}, '', '/?tags=過去文&q=dictionary');
      render(<Default />);

      expect(visibleTexts()).toEqual([analyzedSentence.text]);
      expect(screen.getByRole('button', { name: '過去文', pressed: true })).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toHaveValue('dictionary');
    });
  });

  describe('ページング', () => {
    it('20 件ずつ表示し、次へで次の 20 件を表示して URL に反映する', async () => {
      const user = userEvent.setup();
      render(<Default sentences={manySentences(45)} />);

      expect(visibleTexts()).toHaveLength(20);
      expect(visibleTexts()[0]).toBe('Sentence 1.');
      expect(screen.getByText('1 / 3 ページ（全 45 件）')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '次へ →' }));
      await user.click(screen.getByRole('button', { name: '次へ →' }));

      expect(visibleTexts()).toHaveLength(5);
      expect(visibleTexts()[0]).toBe('Sentence 41.');
      expect(query('page')).toBe('3');

      await user.click(screen.getByRole('button', { name: '← 前へ' }));
      expect(query('page')).toBe('2');
    });

    it('絞り込み条件を変えると 1 ページ目に戻る', async () => {
      const user = userEvent.setup();
      render(<Default sentences={manySentences(45)} />);

      await user.click(screen.getByRole('button', { name: '次へ →' }));
      await user.type(screen.getByRole('searchbox'), 'Sentence');

      expect(screen.getByText('1 / 3 ページ（全 45 件）')).toBeInTheDocument();
      expect(query('page')).toBeNull();
    });

    it('URL のページ番号を復元し、範囲外なら最終ページに丸める', () => {
      window.history.replaceState({}, '', '/?page=9');
      render(<Default sentences={manySentences(45)} />);

      expect(screen.getByText('3 / 3 ページ（全 45 件）')).toBeInTheDocument();
    });

    it('URL のページ番号が不正なら 1 ページ目にする', () => {
      window.history.replaceState({}, '', '/?page=abc');
      render(<Default sentences={manySentences(45)} />);

      expect(screen.getByText('1 / 3 ページ（全 45 件）')).toBeInTheDocument();
    });
  });

  describe('画面遷移・削除', () => {
    it('英文をクリックすると詳細ページへ遷移する', async () => {
      const user = userEvent.setup();
      render(<Default />);

      await user.click(screen.getByText(unanalyzedSentence.text));

      expect(router.visit).toHaveBeenCalledWith(`/sentences/${unanalyzedSentence.id}`);
    });

    it('追加ボタンで新規作成ページへ遷移する', async () => {
      const user = userEvent.setup();
      render(<Default />);

      await user.click(screen.getByRole('button', { name: '+ 英文を追加' }));

      expect(router.visit).toHaveBeenCalledWith('/sentences/new');
    });

    it('削除を確認すると DELETE リクエストを送る', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      render(<Default />);

      await user.click(screen.getAllByRole('button', { name: '削除' })[0]);

      expect(router.delete).toHaveBeenCalledWith(`/sentences/${analyzedSentence.id}`);
    });

    it('削除をキャンセルするとリクエストを送らない', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      render(<Default />);

      await user.click(screen.getAllByRole('button', { name: '削除' })[0]);

      expect(router.delete).not.toHaveBeenCalled();
    });
  });
});
