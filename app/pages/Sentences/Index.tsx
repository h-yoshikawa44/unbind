import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import type { PageProps } from '../../pages.gen';
import { normalizeTags } from '@/types';
import { RootLayout } from '@/layouts/RootLayout';
import { SentenceList } from '@/components/SentenceList/SentenceList';

/** 1 ページあたりに表示する英文の件数。 */
const PAGE_SIZE = 20;

/** URL のクエリパラメータから絞り込み・ページング状態の初期値を読み取る。 */
function readInitialSearch() {
  const params = new URLSearchParams(window.location.search);
  const tags = normalizeTags((params.get('tags') ?? '').split(','));
  const q = (params.get('q') ?? '').trim();
  const page = Number(params.get('page'));
  return {
    tags,
    q,
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/** 絞り込み・ページング状態を URL クエリへ反映する（サーバへは問い合わせない）。 */
function syncUrl(tags: string[], q: string, page: number) {
  const params = new URLSearchParams();
  if (tags.length > 0) params.set('tags', tags.join(','));
  if (q) params.set('q', q);
  // 1 ページ目は URL を汚さないよう省略する。
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  window.history.replaceState({}, '', qs ? `/?${qs}` : '/');
}

export default function Index({ sentences, allTags }: PageProps<'Sentences/Index'>) {
  const initial = useMemo(readInitialSearch, []);
  const [selectedTags, setSelectedTags] = useState<string[]>(initial.tags);
  const [keyword, setKeyword] = useState(initial.q);
  const [page, setPage] = useState(initial.page);

  // 空白区切りで複数キーワードに分割する（各キーワードは AND 条件）。
  const keywords = useMemo(() => keyword.trim().split(/\s+/).filter(Boolean), [keyword]);

  // 絞り込み: 選択タグをすべて含み（AND）、かつ全キーワードを英文または和訳に含む（AND）英文のみ表示する。
  const filteredSentences = useMemo(() => {
    return sentences.filter((sentence) => {
      if (!selectedTags.every((tag) => sentence.tags.includes(tag))) return false;
      if (keywords.length > 0) {
        const haystack = `${sentence.text}\n${sentence.naturalTranslation}`.toLowerCase();
        if (!keywords.every((kw) => haystack.includes(kw.toLowerCase()))) return false;
      }
      return true;
    });
  }, [sentences, selectedTags, keywords]);

  // ページング: 絞り込みや削除で総ページ数が減った場合に備え、表示ページは有効範囲へ丸める。
  const totalPages = Math.max(1, Math.ceil(filteredSentences.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const pagedSentences = useMemo(
    () => filteredSentences.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredSentences, currentPage],
  );

  const handleToggleTag = (tag: string) => {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(next);
    // 絞り込み条件が変わると総ページ数も変わるため、1 ページ目に戻す。
    setPage(1);
    syncUrl(next, keyword.trim(), 1);
  };

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    setPage(1);
    syncUrl(selectedTags, value.trim(), 1);
  };

  const handleClearFilters = () => {
    setKeyword('');
    setSelectedTags([]);
    setPage(1);
    syncUrl([], '', 1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    syncUrl(selectedTags, keyword.trim(), nextPage);
  };

  const handleEdit = (id: string) => {
    router.visit(`/sentences/${id}`);
  };

  const handleDelete = (id: string) => {
    router.delete(`/sentences/${id}`);
  };

  const handleAdd = () => {
    router.visit('/sentences/new');
  };

  return (
    <RootLayout>
      <SentenceList
        sentences={pagedSentences}
        totalCount={filteredSentences.length}
        currentPage={currentPage}
        totalPages={totalPages}
        allTags={allTags}
        selectedTags={selectedTags}
        keyword={keyword}
        onToggleTag={handleToggleTag}
        onKeywordChange={handleKeywordChange}
        onClearFilters={handleClearFilters}
        onPageChange={handlePageChange}
        onEdit={(sentence) => handleEdit(sentence.id)}
        onDelete={handleDelete}
        onAdd={handleAdd}
      />
    </RootLayout>
  );
}
