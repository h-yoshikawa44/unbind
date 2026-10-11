import { useId, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { normalizeTags } from '@/types';
import styles from '@/components/TagInput/TagInput.module.css';

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
  /** 入力補完に使う既存タグ一覧。 */
  suggestions?: string[];
}

export function TagInput({ value, onChange, suggestions = [] }: Props) {
  const [draft, setDraft] = useState('');
  const listId = useId();

  const addTag = (raw: string) => {
    onChange(normalizeTags([...value, raw]));
    setDraft('');
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (draft.trim()) addTag(draft);
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      // 入力が空の状態で Backspace を押したら末尾のタグを削除する。
      removeTag(value[value.length - 1]);
    }
  };

  // 既に付与済みのタグは候補から除外する。
  const availableSuggestions = suggestions.filter((tag) => !value.includes(tag));

  return (
    <div className={styles.tagInput}>
      <ul className={styles.tagChips}>
        {value.map((tag) => (
          <li key={tag} className={styles.tagChip}>
            <span className={styles.tagChipText}>{tag}</span>
            <button
              type="button"
              className={styles.tagChipRemove}
              onClick={() => removeTag(tag)}
              aria-label={`タグ「${tag}」を削除`}
            >
              ×
            </button>
          </li>
        ))}
        <input
          className={styles.tagField}
          type="text"
          value={draft}
          list={listId}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => draft.trim() && addTag(draft)}
          placeholder={value.length === 0 ? '例: 過去文（Enter で追加）' : 'タグを追加...'}
        />
      </ul>
      <datalist id={listId}>
        {availableSuggestions.map((tag) => (
          <option key={tag} value={tag} />
        ))}
      </datalist>
    </div>
  );
}
