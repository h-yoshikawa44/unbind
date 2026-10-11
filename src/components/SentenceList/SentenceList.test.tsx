import { composeStories } from '@storybook/react-vite';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { analyzedSentence, unanalyzedSentence } from '@/fixtures/sentences';
import * as stories from '@/components/SentenceList/SentenceList.stories';

const { Default, Empty, Paginated } = composeStories(stories);

describe('SentenceList', () => {
  describe('一覧表示', () => {
    it('英文ごとに本文・タグ・トークン数を表示する', () => {
      render(<Default />);
      const item = screen.getByRole('button', { name: new RegExp(`^${analyzedSentence.text}`) });
      expect(item).toHaveTextContent(analyzedSentence.text);
      expect(item).toHaveTextContent('過去文');
      expect(item).toHaveTextContent('句動詞');
      expect(item).toHaveTextContent(`${analyzedSentence.tokens.length} トークン`);
      expect(screen.getByText(unanalyzedSentence.text)).toBeInTheDocument();
    });

    it('英文をクリックすると、その英文を onEdit に渡す', async () => {
      const user = userEvent.setup();
      render(<Default />);

      await user.click(screen.getByText(unanalyzedSentence.text));

      expect(Default.args.onEdit).toHaveBeenCalledWith(unanalyzedSentence);
    });

    it('追加ボタンで onAdd を呼ぶ', async () => {
      const user = userEvent.setup();
      render(<Default />);

      await user.click(screen.getByRole('button', { name: '+ 英文を追加' }));

      expect(Default.args.onAdd).toHaveBeenCalledTimes(1);
    });
  });

  describe('削除', () => {
    it('確認ダイアログで OK すると onDelete に id を渡す', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      render(<Default />);

      await user.click(screen.getAllByRole('button', { name: '削除' })[0]);

      expect(confirmSpy).toHaveBeenCalledWith(`"${analyzedSentence.text}" を削除しますか？`);
      expect(Default.args.onDelete).toHaveBeenCalledWith(analyzedSentence.id);
    });

    it('確認ダイアログでキャンセルすると onDelete を呼ばない', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      render(<Default />);

      await user.click(screen.getAllByRole('button', { name: '削除' })[0]);

      expect(Default.args.onDelete).not.toHaveBeenCalled();
    });

    it('長い英文は 40 文字で省略して確認する', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      const text = 'a'.repeat(41);
      render(<Default sentences={[{ ...analyzedSentence, text }]} />);

      await user.click(screen.getByRole('button', { name: '削除' }));

      expect(confirmSpy).toHaveBeenCalledWith(`"${'a'.repeat(40)}..." を削除しますか？`);
    });
  });

  describe('絞り込み', () => {
    it('allTags をタグボタンとして表示し、selectedTags を押下状態にする', () => {
      render(<Default selectedTags={['句動詞']} />);
      expect(screen.getByRole('button', { name: '句動詞', pressed: true })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '過去文', pressed: false })).toBeInTheDocument();
    });

    it('タグボタンを押すと onToggleTag にタグを渡す', async () => {
      const user = userEvent.setup();
      render(<Default />);

      await user.click(screen.getByRole('button', { name: 'あいさつ文' }));

      expect(Default.args.onToggleTag).toHaveBeenCalledWith('あいさつ文');
    });

    it('キーワードを入力すると onKeywordChange に入力値を渡す', async () => {
      const user = userEvent.setup();
      render(<Default />);

      await user.type(screen.getByRole('searchbox'), 'a');

      expect(Default.args.onKeywordChange).toHaveBeenCalledWith('a');
    });

    it('keyword を入力欄に表示する', () => {
      render(<Default keyword="meet" />);
      expect(screen.getByRole('searchbox')).toHaveValue('meet');
    });

    it('絞り込み中だけクリアボタンを出し、押すと onClearFilters を呼ぶ', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<Default />);
      expect(screen.queryByRole('button', { name: 'クリア' })).not.toBeInTheDocument();
      unmount();

      render(<Default keyword="meet" />);
      await user.click(screen.getByRole('button', { name: 'クリア' }));

      expect(Default.args.onClearFilters).toHaveBeenCalledTimes(1);
    });

    it('絞り込み結果が 0 件なら、その旨を表示する', () => {
      render(<Default sentences={[]} selectedTags={['過去文']} />);
      expect(screen.getByText('絞り込み条件に一致する英文はありません。')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: '最初の英文を追加する' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('空の状態', () => {
    it('未登録のメッセージと追加ボタンを表示し、タグの絞り込みは出さない', async () => {
      const user = userEvent.setup();
      render(<Empty />);
      expect(screen.getByText('まだ英文が登録されていません。')).toBeInTheDocument();
      expect(screen.queryByText('タグで絞り込み')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '最初の英文を追加する' }));

      expect(Empty.args.onAdd).toHaveBeenCalledTimes(1);
    });
  });

  describe('ページング', () => {
    it('1 ページしかなければページングを出さない', () => {
      render(<Default />);
      expect(screen.queryByRole('button', { name: '次へ →' })).not.toBeInTheDocument();
    });

    it('現在ページ・総ページ数・総件数を表示する', () => {
      render(<Paginated />);
      expect(screen.getByText('2 / 3 ページ（全 45 件）')).toBeInTheDocument();
    });

    it('前へ / 次へで前後のページ番号を onPageChange に渡す', async () => {
      const user = userEvent.setup();
      render(<Paginated />);

      await user.click(screen.getByRole('button', { name: '← 前へ' }));
      await user.click(screen.getByRole('button', { name: '次へ →' }));

      expect(Paginated.args.onPageChange).toHaveBeenNthCalledWith(1, 1);
      expect(Paginated.args.onPageChange).toHaveBeenNthCalledWith(2, 3);
    });

    it('先頭ページでは前へ、最終ページでは次へを無効にする', () => {
      const { unmount } = render(<Paginated currentPage={1} />);
      expect(screen.getByRole('button', { name: '← 前へ' })).toBeDisabled();
      expect(screen.getByRole('button', { name: '次へ →' })).toBeEnabled();
      unmount();

      render(<Paginated currentPage={3} />);
      expect(screen.getByRole('button', { name: '← 前へ' })).toBeEnabled();
      expect(screen.getByRole('button', { name: '次へ →' })).toBeDisabled();
    });
  });
});
