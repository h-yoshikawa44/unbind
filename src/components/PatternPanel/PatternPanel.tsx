import { useEffect, useRef } from 'react';
import type { Pattern, Token } from '@/types';
import { patternText } from '@/patterns';
import panelStyles from '@/components/TokenAnalysisPanel/TokenAnalysisPanel.module.css';
import buttonStyles from '@/styles/button.module.css';

interface Props {
  pattern: Pattern;
  /** パターンの番号（1 始まり）。連結線のラベルの番号と対応する。 */
  number: number;
  tokens: Token[];
  onChange: (updated: Pattern) => void;
  onDelete: () => void;
}

/** 連結線のラベルをクリックしたときに開く、パターンの意味の入力・削除パネル。 */
export function PatternPanel({ pattern, number, tokens, onChange, onDelete }: Props) {
  const text = patternText(pattern, tokens);
  const meaningRef = useRef<HTMLTextAreaElement>(null);

  // ラベルをクリックして開いたら、そのまま追記できるよう意味の末尾にカーソルを置く。
  // パネルはパターンごとに key を付けて描画するので、開いたとき（マウント時）だけ実行すればよい。
  useEffect(() => {
    const el = meaningRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  return (
    <div className={panelStyles.analysisPanel}>
      <div className={panelStyles.analysisPanelHeader}>
        <div className={panelStyles.analysisTokenInfo}>
          <span className={panelStyles.analysisTokenKind}>パターン{number}</span>
          <span className={panelStyles.analysisTokenText}>{text}</span>
        </div>
        <button
          type="button"
          className={`${buttonStyles.btn} ${buttonStyles.btnOutline} ${buttonStyles.btnSm}`}
          onClick={onDelete}
          aria-label={`パターン「${text}」を削除`}
        >
          削除
        </button>
      </div>

      <div className={panelStyles.analysisFields}>
        <div className={`${panelStyles.fieldGroup} ${panelStyles.fieldGroupWide}`}>
          <label className={panelStyles.fieldLabel} htmlFor={`pattern-meaning-${pattern.id}`}>
            パターンの意味
          </label>
          <textarea
            id={`pattern-meaning-${pattern.id}`}
            value={pattern.meaning}
            onChange={(e) => onChange({ ...pattern, meaning: e.target.value })}
            placeholder="熟語・慣用句・文法パターンとしての意味..."
            rows={2}
            ref={meaningRef}
          />
        </div>
      </div>
    </div>
  );
}
