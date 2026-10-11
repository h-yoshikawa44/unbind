import { composeStories } from '@storybook/react-vite';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import { PART_OF_SPEECH_VALUES } from '@/types';
import * as stories from '@/components/PartOfSpeechSelect/PartOfSpeechSelect.stories';

const { Unselected, Selected } = composeStories(stories);

describe('PartOfSpeechSelect', () => {
  it('未選択の選択肢 + 全品詞を選択肢として表示する', () => {
    render(<Unselected />);
    expect(screen.getAllByRole('option')).toHaveLength(PART_OF_SPEECH_VALUES.length + 1);
    expect(screen.getByRole('combobox')).toHaveValue('');
  });

  it('value に渡した品詞が選択される', () => {
    render(<Selected />);
    expect(screen.getByRole('combobox')).toHaveDisplayValue('動詞');
  });

  it('選択を変更すると onChange に PartOfSpeech が渡る', async () => {
    const user = userEvent.setup();
    render(<Unselected />);

    await user.selectOptions(screen.getByRole('combobox'), '定冠詞');

    expect(Unselected.args.onChange).toHaveBeenCalledWith('definite-article');
  });

  it('未選択に戻すと onChange に null が渡る', async () => {
    const user = userEvent.setup();
    render(<Selected />);

    await user.selectOptions(screen.getByRole('combobox'), '-- 選択 --');

    expect(Selected.args.onChange).toHaveBeenCalledWith(null);
  });
});
