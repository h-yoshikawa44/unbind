import { composeStories } from '@storybook/react-vite';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import { idiomSentence } from '@/fixtures/sentences';
import * as stories from '@/components/IdiomPanel/IdiomPanel.stories';

const { Default, Empty } = composeStories(stories);

describe('IdiomPanel', () => {
  it('慣用句の番号・構成単語・意味を表示する', () => {
    render(<Default />);
    expect(screen.getByText('慣用句1')).toBeInTheDocument();
    // 隣接していない単語の間は「…」でつなぐ。
    expect(screen.getByText('turn … off.')).toBeInTheDocument();
    expect(screen.getByLabelText('慣用句としての意味')).toHaveValue('（明かりなどを）消す');
  });

  it('開いたら意味の入力欄にフォーカスし、カーソルを末尾に置く', () => {
    render(<Default />);
    const meaning = screen.getByLabelText<HTMLTextAreaElement>('慣用句としての意味');
    expect(meaning).toHaveFocus();
    expect(meaning.selectionStart).toBe(meaning.value.length);
  });

  it('意味を入力すると、meaning を更新した慣用句が onChange に渡る', async () => {
    const user = userEvent.setup();
    render(<Empty />);

    await user.type(screen.getByLabelText('慣用句としての意味'), '消');

    expect(Empty.args.onChange).toHaveBeenCalledWith({ ...idiomSentence.idioms[0], meaning: '消' });
  });

  it('削除ボタンで onDelete を呼ぶ', async () => {
    const user = userEvent.setup();
    render(<Default />);

    await user.click(screen.getByRole('button', { name: '慣用句「turn … off.」を削除' }));

    expect(Default.args.onDelete).toHaveBeenCalledTimes(1);
  });
});
