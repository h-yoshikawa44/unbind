import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SentenceEditor } from '@/components/SentenceEditor/SentenceEditor';
import { analyzedSentence, sampleTags, unanalyzedSentence } from '@/fixtures/sentences';

const meta = {
  title: 'Components/SentenceEditor',
  component: SentenceEditor,
  args: {
    sentence: analyzedSentence,
    onSave: fn(),
    onBack: fn(),
    tagSuggestions: sampleTags,
  },
} satisfies Meta<typeof SentenceEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Analyzed: Story = {};

export const Unanalyzed: Story = {
  args: { sentence: unanalyzedSentence },
};
