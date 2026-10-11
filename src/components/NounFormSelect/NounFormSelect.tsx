import { NOUN_FORM_LABELS, NOUN_FORM_VALUES, isNounForm } from '@/types';
import type { NounForm } from '@/types';

interface Props {
  value: NounForm | null;
  onChange: (value: NounForm | null) => void;
}

export function NounFormSelect({ value, onChange }: Props) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v && isNounForm(v) ? v : null);
      }}
    >
      <option value="">-- 選択 --</option>
      {NOUN_FORM_VALUES.map((form) => (
        <option key={form} value={form}>
          {NOUN_FORM_LABELS[form]}
        </option>
      ))}
    </select>
  );
}
