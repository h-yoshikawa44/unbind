import type { Meta, StoryObj } from '@storybook/react-vite';
import Index from '../../pages/Sentences/Index';
import { sampleSentences, sampleTags } from '@/fixtures/sentences';

const meta = {
  title: 'Pages/Sentences/Index',
  component: Index,
  parameters: { layout: 'fullscreen' },
  args: {
    sentences: sampleSentences,
    allTags: sampleTags,
  },
} satisfies Meta<typeof Index>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { sentences: [], allTags: [] },
};
