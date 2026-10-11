import type { Sentence } from '@/types';
import styles from '@/components/SentenceList/SentenceList.module.css';
import buttonStyles from '@/styles/button.module.css';

interface Props {
  sentences: Sentence[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  allTags: string[];
  selectedTags: string[];
  keyword: string;
  onToggleTag: (tag: string) => void;
  onKeywordChange: (value: string) => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onEdit: (sentence: Sentence) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function SentenceList({
  sentences,
  totalCount,
  currentPage,
  totalPages,
  allTags,
  selectedTags,
  keyword,
  onToggleTag,
  onKeywordChange,
  onClearFilters,
  onPageChange,
  onEdit,
  onDelete,
  onAdd,
}: Props) {
  const isFiltering = selectedTags.length > 0 || keyword.trim().length > 0;

  return (
    <div className={styles.sentenceList}>
      <div className={styles.listHeader}>
        <h2>英文一覧</h2>
        <button
          type="button"
          className={`${buttonStyles.btn} ${buttonStyles.btnPrimary}`}
          onClick={onAdd}
        >
          + 英文を追加
        </button>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.filterRow}>
          <span className={styles.filterLabel}>キーワードで絞り込み</span>
          <input
            type="search"
            className={styles.filterKeyword}
            value={keyword}
            placeholder="英文・和訳を検索（空白区切りで複数指定）"
            onChange={(e) => onKeywordChange(e.target.value)}
          />
          {isFiltering && (
            <button type="button" className={styles.filterClear} onClick={onClearFilters}>
              クリア
            </button>
          )}
        </div>

        {allTags.length > 0 && (
          <div className={styles.filterRow}>
            <span className={styles.filterLabel}>タグで絞り込み</span>
            <div className={styles.filterTags}>
              {allTags.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`${styles.filterTag} ${active ? styles.filterTagActive : ''}`}
                    aria-pressed={active}
                    onClick={() => onToggleTag(tag)}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {sentences.length === 0 ? (
        <div className={styles.emptyState}>
          {isFiltering ? (
            <p>絞り込み条件に一致する英文はありません。</p>
          ) : (
            <>
              <p>まだ英文が登録されていません。</p>
              <button
                type="button"
                className={`${buttonStyles.btn} ${buttonStyles.btnPrimary}`}
                onClick={onAdd}
              >
                最初の英文を追加する
              </button>
            </>
          )}
        </div>
      ) : (
        <ul className={styles.sentenceItems}>
          {sentences.map((sentence) => (
            <li key={sentence.id} className={styles.sentenceItem}>
              <button
                type="button"
                className={styles.sentenceItemBody}
                onClick={() => onEdit(sentence)}
              >
                <p className={styles.sentenceItemText}>{sentence.text}</p>
                {sentence.tags.length > 0 && (
                  <div className={styles.sentenceItemTags}>
                    {sentence.tags.map((tag) => (
                      <span key={tag} className={styles.sentenceItemTag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className={styles.sentenceItemMeta}>
                  {sentence.tokens.length} トークン ·{' '}
                  {new Date(sentence.updatedAt).toLocaleDateString('ja-JP')}
                </p>
              </button>
              <button
                type="button"
                className={`${buttonStyles.btn} ${buttonStyles.btnDanger} ${buttonStyles.btnSm}`}
                onClick={() => {
                  if (
                    confirm(
                      `"${sentence.text.slice(0, 40)}${sentence.text.length > 40 ? '...' : ''}" を削除しますか？`,
                    )
                  ) {
                    onDelete(sentence.id);
                  }
                }}
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageButton}
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            ← 前へ
          </button>
          <span className={styles.pageStatus}>
            {currentPage} / {totalPages} ページ（全 {totalCount} 件）
          </span>
          <button
            type="button"
            className={styles.pageButton}
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            次へ →
          </button>
        </div>
      )}
    </div>
  );
}
