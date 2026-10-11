import { composeStories } from '@storybook/react-vite';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import * as stories from '@/components/NounFormSelect/NounFormSelect.stories';

const { Unselected, Selected } = composeStories(stories);

describe('NounFormSelect', () => {
  it('value が null のときは未選択になる', () => {
    render(<Unselected />);
    expect(screen.getByRole('combobox')).toHaveValue('');
  });

  it('value に渡した数が選択される', () => {
    render(<Selected />);
    expect(screen.getByRole('combobox')).toHaveDisplayValue('複数形');
  });

  it('選択を変更すると onChange に NounForm が渡る', async () => {
    const user = userEvent.setup();
    render(<Unselected />);

    await user.selectOptions(screen.getByRole('combobox'), '単数形');

    expect(Unselected.args.onChange).toHaveBeenCalledWith('singular');
  });

  it('未選択に戻すと onChange に null が渡る', async () => {
    const user = userEvent.setup();
    render(<Selected />);

    await user.selectOptions(screen.getByRole('combobox'), '-- 選択 --');

    expect(Selected.args.onChange).toHaveBeenCalledWith(null);
  });
});
