import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SentenceEditor } from '@/components/SentenceEditor/SentenceEditor';
import {
  analyzedSentence,
  idiomSentence,
  multiIdiomSentence,
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

/** 隣接していない単語（turn ... off）を慣用句として登録済み。 */
export const WithIdiom: Story = {
  args: { sentence: idiomSentence },
};

/** 慣用句が重なり合う（連結線を段に分けて描く）。画面幅を狭めると行をまたぐ線も確認できる。 */
export const MultipleIdioms: Story = {
  args: { sentence: multiIdiomSentence },
};

/** 線上のラベルをクリックして、慣用句の意味の入力パネルを開いた状態。 */
export const IdiomPanelOpened: Story = {
  args: { sentence: multiIdiomSentence },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '慣用句「turned … off」を編集' }));
  },
};
