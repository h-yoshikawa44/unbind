import type { Meta, StoryObj } from '@storybook/react-vite';
import New from '../../pages/Sentences/New';
import { sampleTags } from '@/fixtures/sentences';

const meta = {
  title: 'Pages/Sentences/New',
  component: New,
  parameters: { layout: 'fullscreen' },
  args: {
    tagSuggestions: sampleTags,
  },
} satisfies Meta<typeof New>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
