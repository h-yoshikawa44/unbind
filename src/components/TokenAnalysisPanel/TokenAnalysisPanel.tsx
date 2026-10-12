import type { TokenWithAnalysis } from '@/types';
import { effectiveVerbForm, hasVerbForm, verbFormsOf } from '@/types';
import { PartOfSpeechSelect } from '@/components/PartOfSpeechSelect/PartOfSpeechSelect';
import { VerbFormSelect } from '@/components/VerbFormSelect/VerbFormSelect';
import { NounFormSelect } from '@/components/NounFormSelect/NounFormSelect';
import { InfinitiveUsageSelect } from '@/components/InfinitiveUsageSelect/InfinitiveUsageSelect';
import styles from '@/components/TokenAnalysisPanel/TokenAnalysisPanel.module.css';
import buttonStyles from '@/styles/button.module.css';

interface Props {
  token: TokenWithAnalysis;
  onChange: (updated: TokenWithAnalysis) => void;
  onSplit?: () => void;
}

export function TokenAnalysisPanel({ token, onChange, onSplit }: Props) {
  // Generic helper so TypeScript can verify field/value compatibility
  function update<K extends keyof TokenWithAnalysis>(field: K, value: TokenWithAnalysis[K]): void {
    onChange({ ...token, [field]: value });
  }

  const isPhrase = (token.memberTexts?.length ?? 0) > 1;

  return (
    <div className={styles.analysisPanel}>
      <div className={styles.analysisPanelHeader}>
        <div className={styles.analysisTokenInfo}>
          <span className={styles.analysisTokenKind}>{isPhrase ? 'フレーズ' : '単語'}</span>
          <span className={styles.analysisTokenText}>{token.text}</span>
        </div>
        {isPhrase && onSplit && (
          <button
            type="button"
            className={`${buttonStyles.btn} ${buttonStyles.btnOutline} ${buttonStyles.btnSm}`}
            onClick={onSplit}
          >
            分解する
          </button>
        )}
      </div>

      <div className={styles.analysisFields}>
        <div className={`${styles.fieldGroup} ${styles.fieldGroupPos}`}>
          <label className={styles.fieldLabel}>品詞</label>
          <PartOfSpeechSelect
            value={token.partOfSpeech}
            onChange={(v) => update('partOfSpeech', v)}
          />
        </div>

        {hasVerbForm(token.partOfSpeech) && (
          <div className={`${styles.fieldGroup} ${styles.fieldGroupPos}`}>
            <label className={styles.fieldLabel}>変化形</label>
            <VerbFormSelect
              value={effectiveVerbForm(token.partOfSpeech, token.verbForm)}
              onChange={(v) => update('verbForm', v)}
              options={verbFormsOf(token.partOfSpeech)}
            />
          </div>
        )}

        {token.partOfSpeech === 'to-infinitive' && (
          <div className={`${styles.fieldGroup} ${styles.fieldGroupPos}`}>
            <label className={styles.fieldLabel}>変化形</label>
            <InfinitiveUsageSelect
              value={token.infinitiveUsage}
              onChange={(v) => update('infinitiveUsage', v)}
            />
          </div>
        )}

        {token.partOfSpeech === 'noun' && (
          <div className={`${styles.fieldGroup} ${styles.fieldGroupPos}`}>
            <label className={styles.fieldLabel}>数</label>
            <NounFormSelect value={token.nounForm} onChange={(v) => update('nounForm', v)} />
          </div>
        )}

        {isPhrase ? (
          <div className={`${styles.fieldGroup} ${styles.fieldGroupWide}`}>
            <label className={styles.fieldLabel}>慣用句としての意味</label>
            <textarea
              value={token.idiomMeaning}
              onChange={(e) => update('idiomMeaning', e.target.value)}
              placeholder="慣用句・イディオムとして使われる場合の意味..."
              rows={2}
            />
          </div>
        ) : (
          <div className={`${styles.fieldGroup} ${styles.fieldGroupWide}`}>
            <label className={styles.fieldLabel}>単語としての意味</label>
            <textarea
              value={token.wordMeaning}
              onChange={(e) => update('wordMeaning', e.target.value)}
              placeholder="単語・フレーズの基本的な意味..."
              rows={2}
            />
          </div>
        )}
      </div>
    </div>
  );
}
