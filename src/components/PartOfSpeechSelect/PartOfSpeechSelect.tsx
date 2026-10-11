import { PART_OF_SPEECH_LABELS, PART_OF_SPEECH_VALUES, isPartOfSpeech } from '@/types';
import type { PartOfSpeech } from '@/types';

interface Props {
  value: PartOfSpeech | null;
  onChange: (value: PartOfSpeech | null) => void;
}

export function PartOfSpeechSelect({ value, onChange }: Props) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v && isPartOfSpeech(v) ? v : null);
      }}
    >
      <option value="">-- 選択 --</option>
      {PART_OF_SPEECH_VALUES.map((pos) => (
        <option key={pos} value={pos}>
          {PART_OF_SPEECH_LABELS[pos]}
        </option>
      ))}
    </select>
  );
}
