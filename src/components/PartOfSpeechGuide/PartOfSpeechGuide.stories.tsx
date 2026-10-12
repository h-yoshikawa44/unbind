import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { PartOfSpeechGuide } from '@/components/PartOfSpeechGuide/PartOfSpeechGuide';
import buttonStyles from '@/styles/button.module.css';

const meta = {
  title: 'Components/PartOfSpeechGuide',
  component: PartOfSpeechGuide,
  args: {
    open: true,
    onClose: fn(),
  },
  // 制御コンポーネントなので、開閉を args に書き戻し、閉じた後も開き直せるようにする。
  render: function Render(args) {
    const [, updateArgs] = useArgs<typeof args>();
    return (
      <>
        <button
          type="button"
          className={`${buttonStyles.btn} ${buttonStyles.btnOutline}`}
          onClick={() => updateArgs({ open: true })}
        >
          品詞ガイドを開く
        </button>
        <PartOfSpeechGuide
          {...args}
          onClose={() => {
            updateArgs({ open: false });
            args.onClose();
          }}
        />
      </>
    );
  },
} satisfies Meta<typeof PartOfSpeechGuide>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Closed: Story = {
  args: { open: false },
};
