import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SentenceEditor } from '@/components/SentenceEditor/SentenceEditor';
import {
  analyzedSentence,
  patternSentence,
  multiPatternSentence,
  sampleTags,
  unanalyzedSentence,
} from '@/fixtures/sentences';

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

/** 隣接していない単語（turn ... off）をパターンとして登録済み。 */
export const WithPattern: Story = {
  args: { sentence: patternSentence },
};

/** パターンが重なり合う（連結線を段に分けて描く）。画面幅を狭めると行をまたぐ線も確認できる。 */
export const MultiplePatterns: Story = {
  args: { sentence: multiPatternSentence },
};

/** 線上のラベルをクリックして、パターンの意味の入力パネルを開いた状態。 */
export const PatternPanelOpened: Story = {
  args: { sentence: multiPatternSentence },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'パターン「turned … off」を編集' }));
  },
};
