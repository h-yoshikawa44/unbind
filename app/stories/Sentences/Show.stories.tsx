import type { Meta, StoryObj } from '@storybook/react-vite';
import Show from '../../pages/Sentences/Show';
import {
  analyzedSentence,
  idiomSentence,
  sampleTags,
  unanalyzedSentence,
} from '@/fixtures/sentences';

const meta = {
  title: 'Pages/Sentences/Show',
  component: Show,
  parameters: { layout: 'fullscreen' },
  args: {
    sentence: analyzedSentence,
    tagSuggestions: sampleTags,
  },
} satisfies Meta<typeof Show>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Analyzed: Story = {};

export const Unanalyzed: Story = {
  args: { sentence: unanalyzedSentence },
};

export const WithIdiom: Story = {
  args: { sentence: idiomSentence },
};

export const NotFound: Story = {
  args: { sentence: null },
};
