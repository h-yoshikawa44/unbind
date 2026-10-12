export type PartOfSpeech =
  | 'noun'
  | 'pronoun'
  | 'interrogative-pronoun'
  | 'verb'
  | 'be-verb'
  | 'auxiliary-verb'
  | 'adjective'
  | 'adverb'
  | 'preposition'
  | 'conjunction'
  | 'definite-article'
  | 'indefinite-article'
  | 'interjection'
  | 'to-infinitive'
  | 'other';

export const PART_OF_SPEECH_LABELS: Record<PartOfSpeech, string> = {
  noun: '名詞',
  pronoun: '代名詞',
  'interrogative-pronoun': '疑問代名詞',
  verb: '動詞',
  'be-verb': 'be動詞',
  'auxiliary-verb': '助動詞',
  adjective: '形容詞',
  adverb: '副詞',
  preposition: '前置詞',
  conjunction: '接続詞',
  'definite-article': '定冠詞',
  'indefinite-article': '不定冠詞',
  interjection: '感嘆詞',
  'to-infinitive': 'to不定詞',
  other: 'その他',
};

/** 型安全なイテレーションのために使用する PartOfSpeech の値一覧。 */
export const PART_OF_SPEECH_VALUES: ReadonlyArray<PartOfSpeech> = [
  'noun',
  'pronoun',
  'interrogative-pronoun',
  'verb',
  'be-verb',
  'auxiliary-verb',
  'adjective',
  'adverb',
  'preposition',
  'conjunction',
  'definite-article',
  'indefinite-article',
  'interjection',
  'to-infinitive',
  'other',
];

/** PartOfSpeech 値のランタイム検証用タイプガード。 */
export function isPartOfSpeech(value: string): value is PartOfSpeech {
  return value in PART_OF_SPEECH_LABELS;
}

export type VerbForm =
  | 'base'
  | 'present'
  | 'third-person-singular'
  | 'past'
  | 'present-progressive'
  | 'past-progressive'
  | 'present-perfect'
  | 'past-perfect'
  | 'future'
  | 'infinitive'
  | 'gerund'
  | 'past-participle';

export const VERB_FORM_LABELS: Record<VerbForm, string> = {
  base: '原形',
  present: '現在形',
  'third-person-singular': '3単現形',
  past: '過去形',
  'present-progressive': '現在進行形',
  'past-progressive': '過去進行形',
  'present-perfect': '現在完了形',
  'past-perfect': '過去完了形',
  future: '未来形',
  infinitive: '不定詞',
  gerund: '動名詞',
  'past-participle': '過去分詞',
};

/** 型安全なイテレーションのために使用する VerbForm の値一覧。 */
export const VERB_FORM_VALUES: ReadonlyArray<VerbForm> = [
  'base',
  'present',
  'third-person-singular',
  'past',
  'present-progressive',
  'past-progressive',
  'present-perfect',
  'past-perfect',
  'future',
  'infinitive',
  'gerund',
  'past-participle',
];

/** VerbForm 値のランタイム検証用タイプガード。 */
export function isVerbForm(value: string): value is VerbForm {
  return value in VERB_FORM_LABELS;
}

/** 助動詞が取りうる変化形。can → could のように現在形・過去形だけを持つ（進行形・完了形・分詞にはならない）。 */
export const AUXILIARY_VERB_FORM_VALUES: ReadonlyArray<VerbForm> = ['present', 'past'];

/**
 * その品詞で選べる変化形（VerbForm）の一覧。変化形を持たない品詞は空配列。
 * be動詞は動詞と同じ変化形（was / been / being など）を持つ。
 */
export function verbFormsOf(partOfSpeech: PartOfSpeech | null): ReadonlyArray<VerbForm> {
  switch (partOfSpeech) {
    case 'verb':
    case 'be-verb':
      return VERB_FORM_VALUES;
    case 'auxiliary-verb':
      return AUXILIARY_VERB_FORM_VALUES;
    default:
      return [];
  }
}

/** 変化形（VerbForm）を選べる品詞か。 */
export function hasVerbForm(partOfSpeech: PartOfSpeech | null): boolean {
  return verbFormsOf(partOfSpeech).length > 0;
}

/**
 * その品詞で有効な変化形だけを返す。品詞を変えた後に残っている、新しい品詞では選べない変化形は null 扱いにする
 * （例: 動詞で「過去分詞」を選んでから助動詞に変えた場合）。
 */
export function effectiveVerbForm(
  partOfSpeech: PartOfSpeech | null,
  verbForm: VerbForm | null,
): VerbForm | null {
  return verbForm !== null && verbFormsOf(partOfSpeech).includes(verbForm) ? verbForm : null;
}

export type NounForm = 'singular' | 'plural';

export const NOUN_FORM_LABELS: Record<NounForm, string> = {
  singular: '単数形',
  plural: '複数形',
};

/** 型安全なイテレーションのために使用する NounForm の値一覧。 */
export const NOUN_FORM_VALUES: ReadonlyArray<NounForm> = ['singular', 'plural'];

/** NounForm 値のランタイム検証用タイプガード。 */
export function isNounForm(value: string): value is NounForm {
  return value in NOUN_FORM_LABELS;
}

export type InfinitiveUsage = 'noun' | 'adjective' | 'adverb';

export const INFINITIVE_USAGE_LABELS: Record<InfinitiveUsage, string> = {
  noun: '名詞的用法',
  adjective: '形容詞的用法',
  adverb: '副詞的用法',
};

/** 型安全なイテレーションのために使用する InfinitiveUsage の値一覧。 */
export const INFINITIVE_USAGE_VALUES: ReadonlyArray<InfinitiveUsage> = [
  'noun',
  'adjective',
  'adverb',
];

/** InfinitiveUsage 値のランタイム検証用タイプガード。 */
export function isInfinitiveUsage(value: string): value is InfinitiveUsage {
  return value in INFINITIVE_USAGE_LABELS;
}

/**
 * 英文中の単語またはフレーズを表すトークン。
 * DB対応: "tokens" テーブルに対応。
 *
 * memberTexts は隣接する単語を結合して作成したフレーズトークンのみに存在し、
 * 元の個別単語を保持する（フレーズを分解して元に戻す際に使用）。
 */
export interface Token {
  id: string;
  sentenceId: string;
  text: string;
  order: number;
  memberTexts?: string[];
}

/**
 * トークン単体の言語分析データ。
 * DB対応: "token_analyses" テーブルに対応。
 */
export interface TokenAnalysis {
  tokenId: string;
  partOfSpeech: PartOfSpeech | null;
  verbForm: VerbForm | null;
  nounForm: NounForm | null;
  infinitiveUsage: InfinitiveUsage | null;
  wordMeaning: string;
  idiomMeaning: string;
}

/**
 * フロントエンド全体で使用する Token + TokenAnalysis の結合ビュー。
 * バックエンドへ保存する際はそれぞれのテーブルに分割して扱う。
 */
export type TokenWithAnalysis = Token & Omit<TokenAnalysis, 'tokenId'>;

/**
 * 複数のトークンの組み合わせで意味をなすパターン。熟語・慣用句（"turn ... off"）や
 * 文法パターン（"have ... been", "not only ... but also"）をまとめて扱う。
 * DB対応: "patterns" テーブル + "pattern_tokens" 中間テーブルに対応する想定。
 *
 * フレーズトークン（memberTexts）と違いトークン自体は結合しないため、
 * 構成する単語それぞれの品詞・訳を保ったまま、隣接していない単語同士もパターンにできる。
 * tokenIds は英文中のトークン順に並べる。
 */
export interface Pattern {
  id: string;
  tokenIds: string[];
  meaning: string;
}

/**
 * 英文とそのトークン分析データをまとめたエンティティ。
 * DB対応: "sentences" テーブルに対応（トークンは別テーブルで管理）。
 *
 * tags は「過去文」「あいさつ文」などの自由入力ラベル。複数指定可能。
 * DB移行時は sentence_tags 中間テーブルへ分割する想定。
 */
export interface Sentence {
  id: string;
  text: string;
  tokens: TokenWithAnalysis[];
  patterns: Pattern[];
  naturalTranslation: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * タグ配列を正規化する（前後空白の除去・空文字の除外・重複排除。順序は保持）。
 */
export function normalizeTags(tags: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    result.push(tag);
  }
  return result;
}
