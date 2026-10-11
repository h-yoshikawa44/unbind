import { composeStories } from '@storybook/react-vite';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import * as stories from '@/components/TagInput/TagInput.stories';

const { Default, Empty } = composeStories(stories);

describe('TagInput', () => {
  it('value のタグをチップとして表示する', () => {
    render(<Default />);
    expect(screen.getByText('過去文')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'タグ「過去文」を削除' })).toBeInTheDocument();
  });

  it('タグの有無でプレースホルダが変わる', () => {
    const { unmount } = render(<Empty />);
    expect(screen.getByPlaceholderText('例: 過去文（Enter で追加）')).toBeInTheDocument();
    unmount();

    render(<Default />);
    expect(screen.getByPlaceholderText('タグを追加...')).toBeInTheDocument();
  });

  it('付与済みのタグは入力候補から除外する', () => {
    const { container } = render(<Default />);
    const options = [...container.querySelectorAll('datalist option')].map((o) =>
      o.getAttribute('value'),
    );
    expect(options).toEqual(['あいさつ文', '句動詞']);
  });

  it('Enter で入力中のタグを追加し、入力欄を空にする', async () => {
    const user = userEvent.setup();
    render(<Default />);
    const input = screen.getByRole('combobox');

    await user.type(input, '  句動詞 {Enter}');

    // 前後の空白は除去され、既存タグの後ろに追加される。
    expect(Default.args.onChange).toHaveBeenCalledWith(['過去文', '句動詞']);
    expect(input).toHaveValue('');
  });

  it('カンマでもタグを追加できる', async () => {
    const user = userEvent.setup();
    render(<Empty />);

    await user.type(screen.getByRole('combobox'), '疑問文,');

    expect(Empty.args.onChange).toHaveBeenCalledWith(['疑問文']);
  });

  it('既存タグと重複する入力は追加しない', async () => {
    const user = userEvent.setup();
    render(<Default />);

    await user.type(screen.getByRole('combobox'), '過去文{Enter}');

    expect(Default.args.onChange).toHaveBeenCalledWith(['過去文']);
  });

  it('空白だけの入力では onChange を呼ばない', async () => {
    const user = userEvent.setup();
    render(<Default />);

    await user.type(screen.getByRole('combobox'), '   {Enter}');

    expect(Default.args.onChange).not.toHaveBeenCalled();
  });

  it('フォーカスを外すと入力中のタグを確定する', async () => {
    const user = userEvent.setup();
    render(<Empty />);

    await user.type(screen.getByRole('combobox'), '命令文');
    await user.tab();

    expect(Empty.args.onChange).toHaveBeenCalledWith(['命令文']);
  });

  it('削除ボタンでそのタグを除いた配列が onChange に渡る', async () => {
    const user = userEvent.setup();
    render(<Default value={['過去文', '句動詞']} />);

    await user.click(screen.getByRole('button', { name: 'タグ「過去文」を削除' }));

    expect(Default.args.onChange).toHaveBeenCalledWith(['句動詞']);
  });

  it('入力が空のときの Backspace で末尾のタグを削除する', async () => {
    const user = userEvent.setup();
    render(<Default value={['過去文', '句動詞']} />);

    await user.type(screen.getByRole('combobox'), '{Backspace}');

    expect(Default.args.onChange).toHaveBeenCalledWith(['過去文']);
  });
});
