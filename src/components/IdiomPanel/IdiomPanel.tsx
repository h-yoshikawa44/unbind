import { useEffect, useRef } from 'react';
import type { Idiom, Token } from '@/types';
import { idiomText } from '@/idioms';
import panelStyles from '@/components/TokenAnalysisPanel/TokenAnalysisPanel.module.css';
import buttonStyles from '@/styles/button.module.css';

interface Props {
  idiom: Idiom;
  /** 慣用句の番号（1 始まり）。連結線のラベルの番号と対応する。 */
  number: number;
  tokens: Token[];
  onChange: (updated: Idiom) => void;
  onDelete: () => void;
}

/** 連結線のラベルをクリックしたときに開く、慣用句の意味の入力・削除パネル。 */
export function IdiomPanel({ idiom, number, tokens, onChange, onDelete }: Props) {
  const text = idiomText(idiom, tokens);
  const meaningRef = useRef<HTMLTextAreaElement>(null);

  // ラベルをクリックして開いたら、そのまま追記できるよう意味の末尾にカーソルを置く。
  // パネルは慣用句ごとに key を付けて描画するので、開いたとき（マウント時）だけ実行すればよい。
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
          <span className={panelStyles.analysisTokenKind}>慣用句{number}</span>
          <span className={panelStyles.analysisTokenText}>{text}</span>
        </div>
        <button
          type="button"
          className={`${buttonStyles.btn} ${buttonStyles.btnOutline} ${buttonStyles.btnSm}`}
          onClick={onDelete}
          aria-label={`慣用句「${text}」を削除`}
        >
          削除
        </button>
      </div>

      <div className={panelStyles.analysisFields}>
        <div className={`${panelStyles.fieldGroup} ${panelStyles.fieldGroupWide}`}>
          <label className={panelStyles.fieldLabel} htmlFor={`idiom-meaning-${idiom.id}`}>
            慣用句としての意味
          </label>
          <textarea
            id={`idiom-meaning-${idiom.id}`}
            value={idiom.meaning}
            onChange={(e) => onChange({ ...idiom, meaning: e.target.value })}
            placeholder="慣用句・イディオムとして使われる場合の意味..."
            rows={2}
            ref={meaningRef}
          />
        </div>
      </div>
    </div>
  );
}
