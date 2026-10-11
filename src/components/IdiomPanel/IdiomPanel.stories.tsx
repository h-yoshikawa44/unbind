import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { IdiomPanel } from '@/components/IdiomPanel/IdiomPanel';
import { idiomSentence } from '@/fixtures/sentences';

const meta = {
  title: 'Components/IdiomPanel',
  component: IdiomPanel,
  args: {
    idiom: idiomSentence.idioms[0],
    number: 1,
    tokens: idiomSentence.tokens,
    onChange: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof IdiomPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 作成直後（意味が未入力）。 */
export const Empty: Story = {
  args: { idiom: { ...idiomSentence.idioms[0], meaning: '' } },
};
