import { composeStories } from '@storybook/react-vite';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import { PART_OF_SPEECH_LABELS, PART_OF_SPEECH_VALUES } from '@/types';
import * as stories from '@/components/PartOfSpeechGuide/PartOfSpeechGuide.stories';

const { Open, Closed } = composeStories(stories);

describe('PartOfSpeechGuide', () => {
  it('open のときモーダルを表示し、全品詞の説明を並べる', () => {
    render(<Open />);
    const dialog = screen.getByRole('dialog', { name: '品詞ガイド' });
    const sections = within(dialog).getAllByRole('region');
    expect(sections.map((s) => within(s).getByRole('heading', { level: 3 }).textContent)).toEqual(
      PART_OF_SPEECH_VALUES.map((pos) => PART_OF_SPEECH_LABELS[pos]),
    );
  });

  it('各品詞に働き・見分け方・例文を表示し、例文の該当語を強調する', () => {
    render(<Open />);
    const noun = screen.getByRole('region', { name: '名詞' });
    expect(noun).toHaveTextContent('人・物・事柄・概念などの名前を表す');
    expect(within(noun).getByRole('heading', { name: '見分け方' })).toBeInTheDocument();
    const examples = within(noun).getByRole('heading', { name: '例' }).nextElementSibling;
    if (!(examples instanceof HTMLElement)) throw new Error('例文のリストがありません');
    expect(within(examples).getAllByRole('listitem')[0]).toHaveTextContent('The cat is sleeping.');
    expect(within(examples).getByText('cat').tagName).toBe('MARK');
  });

  it('例文が無い品詞は「例」の見出しを出さない', () => {
    render(<Open />);
    const other = screen.getByRole('region', { name: 'その他' });
    expect(within(other).queryByRole('heading', { name: '例' })).not.toBeInTheDocument();
  });

  it('open でないときはモーダルを表示しない', () => {
    render(<Closed />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('閉じるボタンを押すと onClose を呼ぶ', async () => {
    const user = userEvent.setup();
    render(<Open />);
    await user.click(screen.getByRole('button', { name: '閉じる' }));
    expect(Open.args.onClose).toHaveBeenCalledOnce();
  });

  it('モーダルの外側（背景）をクリックすると onClose を呼ぶ', async () => {
    const user = userEvent.setup();
    render(<Open />);
    await user.click(screen.getByRole('dialog'));
    expect(Open.args.onClose).toHaveBeenCalledOnce();
  });

  it('モーダルの中身をクリックしても onClose を呼ばない', async () => {
    const user = userEvent.setup();
    render(<Open />);
    await user.click(screen.getByRole('region', { name: '名詞' }));
    await user.click(screen.getByRole('button', { name: '動詞' }));
    expect(Open.args.onClose).not.toHaveBeenCalled();
  });
});
