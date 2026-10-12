import { VERB_FORM_LABELS, VERB_FORM_VALUES, isVerbForm } from '@/types';
import type { VerbForm } from '@/types';

interface Props {
  value: VerbForm | null;
  onChange: (value: VerbForm | null) => void;
  /** 選択肢にする変化形（省略時はすべて）。助動詞のように一部だけ選べる品詞で絞り込む。 */
  options?: ReadonlyArray<VerbForm>;
}

export function VerbFormSelect({ value, onChange, options = VERB_FORM_VALUES }: Props) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v && isVerbForm(v) ? v : null);
      }}
    >
      <option value="">-- 選択 --</option>
      {options.map((form) => (
        <option key={form} value={form}>
          {VERB_FORM_LABELS[form]}
        </option>
      ))}
    </select>
  );
}
