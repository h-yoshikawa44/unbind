import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SentenceForm } from '@/components/SentenceForm';
import { sampleTags } from '@/fixtures/sentences';

const meta = {
  title: 'Components/SentenceForm',
  component: SentenceForm,
  args: {
    onSubmit: fn(),
    onCancel: fn(),
    tagSuggestions: sampleTags,
  },
} satisfies Meta<typeof SentenceForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
