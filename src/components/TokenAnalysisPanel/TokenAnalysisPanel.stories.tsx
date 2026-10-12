import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { TokenAnalysisPanel } from '@/components/TokenAnalysisPanel/TokenAnalysisPanel';
import { analyzedSentence, unanalyzedSentence } from '@/fixtures/sentences';

/** フィクスチャから指定 id のトークンを取り出す（存在しない id はフィクスチャの誤り）。 */
function tokenOf(sentence: typeof analyzedSentence, id: string) {
  const token = sentence.tokens.find((t) => t.id === id);
  if (!token) throw new Error(`フィクスチャにトークンがありません: ${id}`);
  return token;
}

const meta = {
  title: 'Components/TokenAnalysisPanel',
  component: TokenAnalysisPanel,
  args: {
    token: tokenOf(analyzedSentence, 's1-t3'),
    onChange: fn(),
    onSplit: fn(),
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<typeof args>();
    return (
      <TokenAnalysisPanel
        {...args}
        onChange={(token) => {
          updateArgs({ token });
          args.onChange(token);
        }}
      />
    );
  },
} satisfies Meta<typeof TokenAnalysisPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 名詞: 数（単数/複数）の選択欄が出る。 */
export const Noun: Story = {};

/** 動詞のフレーズトークン: 時制の選択欄と「分解」ボタンが出る。 */
export const VerbPhrase: Story = {
  args: { token: tokenOf(analyzedSentence, 's1-t1') },
};

/** be動詞: 動詞と同じ変化形の選択欄が出る。 */
export const BeVerb: Story = {
  args: {
    token: {
      ...tokenOf(unanalyzedSentence, 's2-t0'),
      text: 'was',
      partOfSpeech: 'be-verb',
      verbForm: 'past',
    },
  },
};

/** 助動詞: 変化形の選択欄が出る（現在形・過去形のみ）。 */
export const AuxiliaryVerb: Story = {
  args: {
    token: {
      ...tokenOf(unanalyzedSentence, 's2-t0'),
      text: 'could',
      partOfSpeech: 'auxiliary-verb',
      verbForm: 'past',
    },
  },
};

/** 動詞で「過去分詞」を選んでから助動詞に変えた状態: 選べない変化形は未選択として表示する。 */
export const AuxiliaryVerbWithStaleForm: Story = {
  args: {
    token: {
      ...tokenOf(unanalyzedSentence, 's2-t0'),
      text: 'could',
      partOfSpeech: 'auxiliary-verb',
      verbForm: 'past-participle',
    },
  },
};

/** to不定詞: 用法（名詞的/形容詞的/副詞的）の選択欄が出る。 */
export const ToInfinitive: Story = {
  args: {
    token: {
      ...tokenOf(unanalyzedSentence, 's2-t1'),
      partOfSpeech: 'to-infinitive',
      infinitiveUsage: 'adverb',
    },
  },
};

export const Unanalyzed: Story = {
  args: { token: tokenOf(unanalyzedSentence, 's2-t0') },
};
