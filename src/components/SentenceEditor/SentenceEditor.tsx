import { useState } from 'react';
import type { Sentence, TokenWithAnalysis } from '@/types';
import {
  INFINITIVE_USAGE_LABELS,
  NOUN_FORM_LABELS,
  PART_OF_SPEECH_LABELS,
  VERB_FORM_LABELS,
} from '@/types';
import { mergeTokens, splitToken } from '@/tokenize';
import { TokenAnalysisPanel } from '@/components/TokenAnalysisPanel/TokenAnalysisPanel';
import { TagInput } from '@/components/TagInput/TagInput';
import styles from '@/components/SentenceEditor/SentenceEditor.module.css';
import buttonStyles from '@/styles/button.module.css';

interface Props {
  sentence: Sentence;
  onSave: (tokens: TokenWithAnalysis[], naturalTranslation: string, tags: string[]) => void;
  onBack: () => void;
  tagSuggestions?: string[];
}

export function SentenceEditor({ sentence, onSave, onBack, tagSuggestions = [] }: Props) {
  const [tokens, setTokens] = useState<TokenWithAnalysis[]>(sentence.tokens);
  const [naturalTranslation, setNaturalTranslation] = useState(sentence.naturalTranslation);
  const [tags, setTags] = useState<string[]>(sentence.tags);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPhraseMode, setIsPhraseMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);

  const activeToken = tokens.find((t) => t.id === activeId) ?? null;

  const handleTokenClick = (id: string) => {
    if (isPhraseMode) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    } else {
      setActiveId((prev) => (prev === id ? null : id));
    }
  };

  const isSelectedAdjacent = (): boolean => {
    if (selected.size < 2) return false;
    const indices = tokens
      .map((t, i) => (selected.has(t.id) ? i : -1))
      .filter((i) => i !== -1)
      .sort((a, b) => a - b);
    for (let i = 1; i < indices.length; i++) {
      if (indices[i] !== indices[i - 1] + 1) return false;
    }
    return true;
  };

  const handleGroup = () => {
    try {
      const newTokens = mergeTokens(tokens, [...selected]);
      setTokens(newTokens);
      setSelected(new Set());
      setIsPhraseMode(false);
      setActiveId(null);
      setIsDirty(true);
    } catch {
      // 非隣接トークンを選択した場合 — ボタンは無効化されているが念のためガード
    }
  };

  const handleSplit = (id: string) => {
    const newTokens = splitToken(tokens, id);
    setTokens(newTokens);
    setActiveId(null);
    setIsDirty(true);
  };

  const handleTokenChange = (updated: TokenWithAnalysis) => {
    setTokens((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setIsDirty(true);
  };

  const handleSave = () => {
    onSave(tokens, naturalTranslation, tags);
    setIsDirty(false);
  };

  const handleTagsChange = (next: string[]) => {
    setTags(next);
    setIsDirty(true);
  };

  const handleBack = () => {
    if (isDirty && !confirm('保存していない変更があります。戻りますか？')) return;
    onBack();
  };

  const togglePhraseMode = () => {
    setIsPhraseMode((prev) => !prev);
    setSelected(new Set());
    setActiveId(null);
  };

  const canGroup = selected.size >= 2 && isSelectedAdjacent();
  const selectionInvalid = selected.size >= 2 && !isSelectedAdjacent();

  return (
    <div className={styles.editor}>
      <div className={styles.editorHeader}>
        <button
          type="button"
          className={`${buttonStyles.btn} ${buttonStyles.btnOutline}`}
          onClick={handleBack}
        >
          ← 戻る
        </button>
        <p className={styles.editorTitle}>{sentence.text}</p>
        <button
          type="button"
          className={`${buttonStyles.btn} ${buttonStyles.btnPrimary}`}
          onClick={handleSave}
          disabled={!isDirty}
        >
          保存
        </button>
      </div>

      <div className={styles.tokenArea}>
        <div className={styles.tokenToolbar}>
          <span className={styles.toolbarLabel}>フレーズ操作:</span>
          <button
            type="button"
            className={`${buttonStyles.btn} ${buttonStyles.btnSm} ${isPhraseMode ? buttonStyles.btnActive : buttonStyles.btnOutline}`}
            onClick={togglePhraseMode}
          >
            {isPhraseMode ? '選択中...' : 'フレーズを作成'}
          </button>
          {isPhraseMode && canGroup && (
            <button
              type="button"
              className={`${buttonStyles.btn} ${buttonStyles.btnSm} ${buttonStyles.btnPrimary}`}
              onClick={handleGroup}
            >
              グループ化
            </button>
          )}
          {isPhraseMode && selectionInvalid && (
            <span className={styles.toolbarWarning}>隣接したトークンのみグループ化できます</span>
          )}
          {isPhraseMode && selected.size === 0 && (
            <span className={styles.toolbarHint}>グループ化したいトークンを選択してください</span>
          )}
        </div>

        <div className={styles.tokenList} role="list">
          {tokens.map((token) => {
            const isPhrase = (token.memberTexts?.length ?? 0) > 1;
            const isActive = activeId === token.id;
            const isSelected = selected.has(token.id);

            const chipClasses = [styles.tokenChip];
            if (isPhrase) chipClasses.push(styles.tokenChipPhrase);
            if (isActive) chipClasses.push(styles.tokenChipActive);
            if (isSelected) chipClasses.push(styles.tokenChipSelected);
            const chipClassName = chipClasses.join(' ');

            return (
              <button
                key={token.id}
                type="button"
                role="listitem"
                className={chipClassName}
                onClick={() => handleTokenClick(token.id)}
              >
                <span className={styles.tokenChipText}>{token.text}</span>
                {!isPhraseMode && (
                  <span className={styles.tokenPosBadge} data-pos={token.partOfSpeech ?? undefined}>
                    {token.partOfSpeech ? PART_OF_SPEECH_LABELS[token.partOfSpeech] : '—'}
                  </span>
                )}
                {!isPhraseMode && token.partOfSpeech === 'verb' && token.verbForm && (
                  <span className={styles.tokenVerbformBadge}>
                    {VERB_FORM_LABELS[token.verbForm]}
                  </span>
                )}
                {!isPhraseMode && token.partOfSpeech === 'noun' && token.nounForm && (
                  <span className={styles.tokenNounformBadge}>
                    {NOUN_FORM_LABELS[token.nounForm]}
                  </span>
                )}
                {!isPhraseMode &&
                  token.partOfSpeech === 'to-infinitive' &&
                  token.infinitiveUsage && (
                    <span className={styles.tokenInfinitiveUsageBadge}>
                      {INFINITIVE_USAGE_LABELS[token.infinitiveUsage]}
                    </span>
                  )}
                {!isPhraseMode && token.wordMeaning && (
                  <span className={styles.tokenChipMeaning}>{token.wordMeaning}</span>
                )}
                {!isPhraseMode && token.idiomMeaning && (
                  <span className={`${styles.tokenChipMeaning} ${styles.tokenChipMeaningIdiom}`}>
                    慣: {token.idiomMeaning}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.sentenceTranslation}>
        <label className={styles.sentenceTranslationLabel} htmlFor="natural-translation">
          意訳
        </label>
        <textarea
          id="natural-translation"
          className={styles.sentenceTranslationInput}
          value={naturalTranslation}
          onChange={(e) => {
            setNaturalTranslation(e.target.value);
            setIsDirty(true);
          }}
          placeholder="文章全体の自然な日本語訳..."
          rows={3}
        />
      </div>

      <div className={styles.sentenceTags}>
        <span className={styles.sentenceTagsLabel}>タグ</span>
        <TagInput value={tags} onChange={handleTagsChange} suggestions={tagSuggestions} />
      </div>

      {activeToken && !isPhraseMode ? (
        <TokenAnalysisPanel
          token={activeToken}
          onChange={handleTokenChange}
          onSplit={
            (activeToken.memberTexts?.length ?? 0) > 1
              ? () => handleSplit(activeToken.id)
              : undefined
          }
        />
      ) : (
        !isPhraseMode && (
          <div className={styles.emptyHint}>
            <p>トークンをクリックして分析情報を入力できます</p>
          </div>
        )
      )}
    </div>
  );
}
