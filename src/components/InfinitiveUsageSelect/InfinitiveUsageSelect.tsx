import { INFINITIVE_USAGE_LABELS, INFINITIVE_USAGE_VALUES, isInfinitiveUsage } from '@/types';
import type { InfinitiveUsage } from '@/types';

interface Props {
  value: InfinitiveUsage | null;
  onChange: (value: InfinitiveUsage | null) => void;
}

export function InfinitiveUsageSelect({ value, onChange }: Props) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v && isInfinitiveUsage(v) ? v : null);
      }}
    >
      <option value="">-- 選択 --</option>
      {INFINITIVE_USAGE_VALUES.map((usage) => (
        <option key={usage} value={usage}>
          {INFINITIVE_USAGE_LABELS[usage]}
        </option>
      ))}
    </select>
  );
}
