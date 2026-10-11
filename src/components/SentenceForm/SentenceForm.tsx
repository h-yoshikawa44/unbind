import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { normalizeTags } from '@/types';
import { TagInput } from '@/components/TagInput/TagInput';
import styles from '@/components/SentenceForm/SentenceForm.module.css';
import buttonStyles from '@/styles/button.module.css';

interface Props {
  onSubmit: (text: string, tags: string[]) => void;
  onCancel: () => void;
  tagSuggestions?: string[];
}

export function SentenceForm({ onSubmit, onCancel, tagSuggestions = [] }: Props) {
  const [text, setText] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed, normalizeTags(tags));
  };

  return (
    <form className={styles.sentenceForm} onSubmit={handleSubmit}>
      <h2>英文を入力</h2>
      <textarea
        className={styles.sentenceInput}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="例: The quick brown fox jumps over the lazy dog."
        rows={3}
        autoFocus
      />
      <div className={styles.tagField}>
        <span className={styles.tagLabel}>タグ</span>
        <TagInput value={tags} onChange={setTags} suggestions={tagSuggestions} />
      </div>
      <div className={styles.formActions}>
        <button
          type="button"
          className={`${buttonStyles.btn} ${buttonStyles.btnOutline}`}
          onClick={onCancel}
        >
          キャンセル
        </button>
        <button
          type="submit"
          className={`${buttonStyles.btn} ${buttonStyles.btnPrimary}`}
          disabled={!text.trim()}
        >
          分解する
        </button>
      </div>
    </form>
  );
}
