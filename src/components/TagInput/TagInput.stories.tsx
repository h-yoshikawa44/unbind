import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { TagInput } from '@/components/TagInput/TagInput';
import { sampleTags } from '@/fixtures/sentences';

const meta = {
  title: 'Components/TagInput',
  component: TagInput,
  args: {
    value: ['過去文'],
    onChange: fn(),
    suggestions: sampleTags,
  },
  // 制御コンポーネントなので、変更を args に書き戻して操作できるようにする。
  render: function Render(args) {
    const [, updateArgs] = useArgs<typeof args>();
    return (
      <TagInput
        {...args}
        onChange={(value) => {
          updateArgs({ value });
          args.onChange(value);
        }}
      />
    );
  },
} satisfies Meta<typeof TagInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { value: [] },
};
