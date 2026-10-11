import type { Meta, StoryObj } from '@storybook/react-vite';
import ErrorPage from '../pages/Error';

const meta = {
  title: 'Pages/Error',
  component: ErrorPage,
  parameters: { layout: 'fullscreen' },
  args: {
    message: 'データの読み込みに失敗しました。',
  },
} satisfies Meta<typeof ErrorPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
