import { composeStories } from '@storybook/react-vite';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import * as stories from '@/components/SentenceForm/SentenceForm.stories';

const { Default } = composeStories(stories);

describe('SentenceForm', () => {
  it('英文が空のうちは送信ボタンを無効にし、入力すると有効にする', async () => {
    const user = userEvent.setup();
    render(<Default />);
    const submit = screen.getByRole('button', { name: '分解する' });
    expect(submit).toBeDisabled();

    await user.type(screen.getByRole('textbox'), '   ');
    expect(submit).toBeDisabled();

    await user.type(screen.getByRole('textbox'), 'Hello.');
    expect(submit).toBeEnabled();
  });

  it('tagSuggestions をタグの入力候補として渡す', () => {
    const { container } = render(<Default />);
    const options = [...container.querySelectorAll('datalist option')].map((o) =>
      o.getAttribute('value'),
    );
    expect(options).toEqual(Default.args.tagSuggestions);
  });

  it('追加したタグをチップとして表示する（フォーム内の state に保持される）', async () => {
    const user = userEvent.setup();
    render(<Default />);

    await user.type(screen.getByRole('combobox'), '過去文{Enter}');

    expect(screen.getByRole('button', { name: 'タグ「過去文」を削除' })).toBeInTheDocument();
  });

  it('送信すると前後の空白を除いた英文と入力したタグを onSubmit に渡す', async () => {
    const user = userEvent.setup();
    render(<Default />);

    await user.type(screen.getByRole('textbox'), '  Nice to meet you.  ');
    await user.type(screen.getByRole('combobox'), 'あいさつ文{Enter}');
    await user.type(screen.getByRole('combobox'), '会話{Enter}');
    await user.click(screen.getByRole('button', { name: 'タグ「会話」を削除' }));
    await user.click(screen.getByRole('button', { name: '分解する' }));

    expect(Default.args.onSubmit).toHaveBeenCalledWith('Nice to meet you.', ['あいさつ文']);
  });

  it('キャンセルボタンで onCancel を呼ぶ', async () => {
    const user = userEvent.setup();
    render(<Default />);

    await user.click(screen.getByRole('button', { name: 'キャンセル' }));

    expect(Default.args.onCancel).toHaveBeenCalledTimes(1);
    expect(Default.args.onSubmit).not.toHaveBeenCalled();
  });
});
