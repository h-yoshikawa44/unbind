import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { VerbFormSelect } from '@/components/VerbFormSelect/VerbFormSelect';
import { AUXILIARY_VERB_FORM_VALUES } from '@/types';

const meta = {
  title: 'Components/VerbFormSelect',
  component: VerbFormSelect,
  args: {
    value: null,
    onChange: fn(),
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<typeof args>();
    return (
      <VerbFormSelect
        {...args}
        onChange={(value) => {
          updateArgs({ value });
          args.onChange(value);
        }}
      />
    );
  },
} satisfies Meta<typeof VerbFormSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = {};

export const Selected: Story = {
  args: { value: 'past' },
};

/** 選択肢を絞り込んだ状態（助動詞は現在形・過去形のみ）。 */
export const LimitedOptions: Story = {
  args: { options: AUXILIARY_VERB_FORM_VALUES },
};
