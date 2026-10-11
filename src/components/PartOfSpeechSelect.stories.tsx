import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { PartOfSpeechSelect } from '@/components/PartOfSpeechSelect';

const meta = {
  title: 'Components/PartOfSpeechSelect',
  component: PartOfSpeechSelect,
  args: {
    value: null,
    onChange: fn(),
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<typeof args>();
    return (
      <PartOfSpeechSelect
        {...args}
        onChange={(value) => {
          updateArgs({ value });
          args.onChange(value);
        }}
      />
    );
  },
} satisfies Meta<typeof PartOfSpeechSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = {};

export const Selected: Story = {
  args: { value: 'verb' },
};
