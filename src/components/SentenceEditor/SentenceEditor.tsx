import { useState } from 'react';
import type { Pattern, Sentence, TokenWithAnalysis } from '@/types';
import {
  INFINITIVE_USAGE_LABELS,
  NOUN_FORM_LABELS,
  PART_OF_SPEECH_LABELS,
  VERB_FORM_LABELS,
} from '@/types';
import { mergeTokens, splitToken } from '@/tokenize';
import { createPattern, replacePatternTokens } from '@/patterns';
import { TokenAnalysisPanel } from '@/components/TokenAnalysisPanel/TokenAnalysisPanel';
import { PatternPanel } from '@/components/PatternPanel/PatternPanel';
import {
  PatternConnectors,
  usePatternConnectors,
} from '@/components/PatternConnectors/PatternConnectors';
import { TagInput } from '@/components/TagInput/TagInput';
import { PartOfSpeechGuide } from '@/components/PartOfSpeechGuide/PartOfSpeechGuide';
import styles from '@/components/SentenceEditor/SentenceEditor.module.css';
import buttonStyles from '@/styles/button.module.css';

/** トークンを複数選択するモード（フレーズの結合 / パターンの登録）。 */
type SelectMode = 'phrase' | 'pattern';

interface Props {
  sentence: Sentence;
  onSave: (
    tokens: TokenWithAnalysis[],
    patterns: Pattern[],
    naturalTranslation: string,
    tags: string[],
  ) => void;
  onBack: () => void;
  tagSuggestions?: string[];
}

export function SentenceEditor({ sentence, onSave, onBack, tagSuggestions = [] }: Props) {
  const [tokens, setTokens] = useState<TokenWithAnalysis[]>(sentence.tokens);
  const [patterns, setPatterns] = useState<Pattern[]>(sentence.patterns);
  const [naturalTranslation, setNaturalTranslation] = useState(sentence.naturalTranslation);
  const [tags, setTags] = useState<string[]>(sentence.tags);
  const [activeId, setActiveId] = useState<string | null>(null);
  // パネルで編集中のパターン（activeId のトークンとは同時に開かない）。
  const [activePatternId, setActivePatternId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState<SelectMode | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const isPhraseMode = selectMode === 'phrase';
  const isPatternMode = selectMode === 'pattern';
  const isSelecting = selectMode !== null;

  const activeToken = tokens.find((t) => t.id === activeId) ?? null;
  const activePattern = patterns.find((i) => i.id === activePatternId) ?? null;

  const connectors = usePatternConnectors(patterns, tokens);

  const handleTokenClick = (id: string) => {
    if (isSelecting) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    } else {
      setActiveId((prev) => (prev === id ? null : id));
      setActivePatternId(null);
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

  /** トークンの入れ替え（結合・分解）を反映し、パターンの参照も追従させる。 */
  const applyTokens = (newTokens: TokenWithAnalysis[]) => {
    const prevIds = new Set(tokens.map((t) => t.id));
    const nextIds = new Set(newTokens.map((t) => t.id));
    const removedIds = tokens.filter((t) => !nextIds.has(t.id)).map((t) => t.id);
    const addedIds = newTokens.filter((t) => !prevIds.has(t.id)).map((t) => t.id);
    setTokens(newTokens);
    setPatterns((prev) => replacePatternTokens(prev, newTokens, removedIds, addedIds));
    setActiveId(null);
    setIsDirty(true);
  };

  const handleGroup = () => {
    try {
      applyTokens(mergeTokens(tokens, [...selected]));
      setSelected(new Set());
      setSelectMode(null);
    } catch {
      // 非隣接トークンを選択した場合 — ボタンは無効化されているが念のためガード
    }
  };

  const handleSplit = (id: string) => {
    applyTokens(splitToken(tokens, id));
  };

  const handleCreatePattern = () => {
    const pattern = createPattern([...selected], tokens);
    setPatterns((prev) => [...prev, pattern]);
    setSelected(new Set());
    setSelectMode(null);
    // 作成したパターンのパネルを開き、そのまま意味を入力できるようにする。
    setActivePatternId(pattern.id);
    setIsDirty(true);
  };

  const handlePatternLabelClick = (id: string) => {
    setActivePatternId((prev) => (prev === id ? null : id));
    setActiveId(null);
  };

  const handlePatternChange = (updated: Pattern) => {
    setPatterns((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setIsDirty(true);
  };

  const handlePatternDelete = (id: string) => {
    setPatterns((prev) => prev.filter((i) => i.id !== id));
    setActivePatternId(null);
    setIsDirty(true);
  };

  const handleTokenChange = (updated: TokenWithAnalysis) => {
    setTokens((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setIsDirty(true);
  };

  const handleSave = () => {
    onSave(tokens, patterns, naturalTranslation, tags);
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

  const toggleSelectMode = (mode: SelectMode) => {
    setSelectMode((prev) => (prev === mode ? null : mode));
    setSelected(new Set());
    setActiveId(null);
    setActivePatternId(null);
  };

  const canGroup = isPhraseMode && selected.size >= 2 && isSelectedAdjacent();
  const selectionInvalid = isPhraseMode && selected.size >= 2 && !isSelectedAdjacent();
  const canCreatePattern = isPatternMode && selected.size >= 2;

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
          <span className={styles.toolbarLabel}>トークン操作:</span>
          {!isPatternMode && (
            <button
              type="button"
              className={`${buttonStyles.btn} ${buttonStyles.btnSm} ${isPhraseMode ? buttonStyles.btnActive : buttonStyles.btnOutline}`}
              onClick={() => toggleSelectMode('phrase')}
            >
              {isPhraseMode ? '選択中...' : '隣接フレーズを作成'}
            </button>
          )}
          {!isPhraseMode && (
            <button
              type="button"
              className={`${buttonStyles.btn} ${buttonStyles.btnSm} ${isPatternMode ? buttonStyles.btnActive : buttonStyles.btnOutline}`}
              onClick={() => toggleSelectMode('pattern')}
            >
              {isPatternMode ? '選択中...' : 'パターンを作成'}
            </button>
          )}
          {canGroup && (
            <button
              type="button"
              className={`${buttonStyles.btn} ${buttonStyles.btnSm} ${buttonStyles.btnPrimary}`}
              onClick={handleGroup}
            >
              グループ化
            </button>
          )}
          {selectionInvalid && (
            <span className={styles.toolbarWarning}>隣接したトークンのみグループ化できます</span>
          )}
          {isPhraseMode && selected.size === 0 && (
            <span className={styles.toolbarHint}>グループ化したいトークンを選択してください</span>
          )}
          {canCreatePattern && (
            <button
              type="button"
              className={`${buttonStyles.btn} ${buttonStyles.btnSm} ${buttonStyles.btnPrimary}`}
              onClick={handleCreatePattern}
            >
              パターンに登録
            </button>
          )}
          {isPatternMode && selected.size < 2 && (
            <span className={styles.toolbarHint}>
              パターンを構成するトークンを2つ以上選択してください（離れていても選べます）
            </span>
          )}
          <button
            type="button"
            className={`${buttonStyles.btn} ${buttonStyles.btnSm} ${buttonStyles.btnOutline} ${styles.guideButton}`}
            onClick={() => setIsGuideOpen(true)}
          >
            品詞ガイド
          </button>
        </div>

        <div className={styles.tokenListWrap} ref={connectors.containerRef}>
          <div className={styles.tokenList} role="list" style={connectors.listStyle}>
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
                  ref={connectors.chipRef(token.id)}
                  type="button"
                  role="listitem"
                  className={chipClassName}
                  onClick={() => handleTokenClick(token.id)}
                >
                  <span className={styles.tokenChipText}>{token.text}</span>
                  {!isSelecting && (
                    <span
                      className={styles.tokenPosBadge}
                      data-pos={token.partOfSpeech ?? undefined}
                    >
                      {token.partOfSpeech ? PART_OF_SPEECH_LABELS[token.partOfSpeech] : '—'}
                    </span>
                  )}
                  {!isSelecting && token.partOfSpeech === 'verb' && token.verbForm && (
                    <span className={styles.tokenVerbformBadge}>
                      {VERB_FORM_LABELS[token.verbForm]}
                    </span>
                  )}
                  {!isSelecting && token.partOfSpeech === 'noun' && token.nounForm && (
                    <span className={styles.tokenNounformBadge}>
                      {NOUN_FORM_LABELS[token.nounForm]}
                    </span>
                  )}
                  {!isSelecting &&
                    token.partOfSpeech === 'to-infinitive' &&
                    token.infinitiveUsage && (
                      <span className={styles.tokenInfinitiveUsageBadge}>
                        {INFINITIVE_USAGE_LABELS[token.infinitiveUsage]}
                      </span>
                    )}
                  {!isSelecting && token.wordMeaning && (
                    <span className={styles.tokenChipMeaning}>{token.wordMeaning}</span>
                  )}
                  {!isSelecting && token.idiomMeaning && (
                    <span className={`${styles.tokenChipMeaning} ${styles.tokenChipMeaningIdiom}`}>
                      慣: {token.idiomMeaning}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <PatternConnectors
            layout={connectors.layout}
            patterns={patterns}
            tokens={tokens}
            activePatternId={isSelecting ? null : activePatternId}
            onLabelClick={isSelecting ? undefined : handlePatternLabelClick}
          />
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

      {activePattern && !isSelecting ? (
        <PatternPanel
          key={activePattern.id}
          pattern={activePattern}
          number={patterns.indexOf(activePattern) + 1}
          tokens={tokens}
          onChange={handlePatternChange}
          onDelete={() => handlePatternDelete(activePattern.id)}
        />
      ) : activeToken && !isSelecting ? (
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
        !isSelecting && (
          <div className={styles.emptyHint}>
            <p>トークンをクリックして分析情報を入力できます</p>
            {patterns.length > 0 && (
              <p>パターンの線上の意味をクリックすると、パターンの意味を編集できます</p>
            )}
          </div>
        )
      )}

      <PartOfSpeechGuide open={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}
