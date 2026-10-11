import { composeStories } from '@storybook/react-vite';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import { VERB_FORM_VALUES } from '@/types';
import * as stories from '@/components/VerbFormSelect/VerbFormSelect.stories';

const { Unselected, Selected } = composeStories(stories);

describe('VerbFormSelect', () => {
  it('未選択の選択肢 + 全変化形を選択肢として表示する', () => {
    render(<Unselected />);
    expect(screen.getAllByRole('option')).toHaveLength(VERB_FORM_VALUES.length + 1);
    expect(screen.getByRole('combobox')).toHaveValue('');
  });

  it('value に渡した変化形が選択される', () => {
    render(<Selected />);
    expect(screen.getByRole('combobox')).toHaveDisplayValue('過去形');
  });

  it('選択を変更すると onChange に VerbForm が渡る', async () => {
    const user = userEvent.setup();
    render(<Unselected />);

    await user.selectOptions(screen.getByRole('combobox'), '3単現形');

    expect(Unselected.args.onChange).toHaveBeenCalledWith('third-person-singular');
  });

  it('未選択に戻すと onChange に null が渡る', async () => {
    const user = userEvent.setup();
    render(<Selected />);

    await user.selectOptions(screen.getByRole('combobox'), '-- 選択 --');

    expect(Selected.args.onChange).toHaveBeenCalledWith(null);
  });
});
