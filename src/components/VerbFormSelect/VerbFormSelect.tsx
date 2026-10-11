import { VERB_FORM_LABELS, VERB_FORM_VALUES, isVerbForm } from '@/types';
import type { VerbForm } from '@/types';

interface Props {
  value: VerbForm | null;
  onChange: (value: VerbForm | null) => void;
}

export function VerbFormSelect({ value, onChange }: Props) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v && isVerbForm(v) ? v : null);
      }}
    >
      <option value="">-- 選択 --</option>
      {VERB_FORM_VALUES.map((form) => (
        <option key={form} value={form}>
          {VERB_FORM_LABELS[form]}
        </option>
      ))}
    </select>
  );
}
