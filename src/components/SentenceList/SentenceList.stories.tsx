import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { SentenceList } from '@/components/SentenceList/SentenceList';
import { sampleSentences, sampleTags } from '@/fixtures/sentences';

const meta = {
  title: 'Components/SentenceList',
  component: SentenceList,
  args: {
    sentences: sampleSentences,
    totalCount: sampleSentences.length,
    currentPage: 1,
    totalPages: 1,
    allTags: sampleTags,
    selectedTags: [],
    keyword: '',
    onToggleTag: fn(),
    onKeywordChange: fn(),
    onClearFilters: fn(),
    onPageChange: fn(),
    onEdit: fn(),
    onDelete: fn(),
    onAdd: fn(),
  },
  // 絞り込み・ページングの状態は親（Index ページ）が持つ。ここでは入力 UI の見た目だけ追従させ、
  // 実際の絞り込み結果は Pages/Sentences/Index で確認する。
  render: function Render(args) {
    const [, updateArgs] = useArgs<typeof args>();
    return (
      <SentenceList
        {...args}
        onToggleTag={(tag) => {
          const selectedTags = args.selectedTags.includes(tag)
            ? args.selectedTags.filter((t) => t !== tag)
            : [...args.selectedTags, tag];
          updateArgs({ selectedTags });
          args.onToggleTag(tag);
        }}
        onKeywordChange={(keyword) => {
          updateArgs({ keyword });
          args.onKeywordChange(keyword);
        }}
        onClearFilters={() => {
          updateArgs({ selectedTags: [], keyword: '' });
          args.onClearFilters();
        }}
        onPageChange={(currentPage) => {
          updateArgs({ currentPage });
          args.onPageChange(currentPage);
        }}
      />
    );
  },
} satisfies Meta<typeof SentenceList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { sentences: [], totalCount: 0, allTags: [] },
};

export const Paginated: Story = {
  args: { totalCount: 45, currentPage: 2, totalPages: 3 },
};
