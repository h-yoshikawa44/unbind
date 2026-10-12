import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { InfinitiveUsageSelect } from '@/components/InfinitiveUsageSelect/InfinitiveUsageSelect';

const meta = {
  title: 'Components/InfinitiveUsageSelect',
  component: InfinitiveUsageSelect,
  args: {
    value: null,
    onChange: fn(),
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<typeof args>();
    return (
      <InfinitiveUsageSelect
        {...args}
        onChange={(value) => {
          updateArgs({ value });
          args.onChange(value);
        }}
      />
    );
  },
} satisfies Meta<typeof InfinitiveUsageSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = {};

export const Selected: Story = {
  args: { value: 'adverb' },
};
