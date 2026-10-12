import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { PatternPanel } from '@/components/PatternPanel/PatternPanel';
import { patternSentence } from '@/fixtures/sentences';

const meta = {
  title: 'Components/PatternPanel',
  component: PatternPanel,
  args: {
    pattern: patternSentence.patterns[0],
    number: 1,
    tokens: patternSentence.tokens,
    onChange: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof PatternPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 作成直後（意味が未入力）。 */
export const Empty: Story = {
  args: { pattern: { ...patternSentence.patterns[0], meaning: '' } },
};
