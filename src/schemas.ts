/**
 * ドメイン型のランタイム検証スキーマ（Zod）。
 *
 * types.ts の interface は正とし、ここでは各スキーマに
 * `satisfies z.ZodType<T>` を付けて「スキーマの出力が型と一致する」ことを
 * コンパイル時に保証する（型定義と検証がズレるのを防ぐ）。
 *
 * 用途:
 * - store.ts: data.json（将来は DB）から読んだデータの検証
 * - server.tsx: クライアントから来るリクエストボディの検証（@hono/zod-validator）
 */
import { z } from 'zod';
import type { Pattern, Sentence, TokenWithAnalysis } from '@/types';
import {
  INFINITIVE_USAGE_VALUES,
  NOUN_FORM_VALUES,
  PART_OF_SPEECH_VALUES,
  VERB_FORM_VALUES,
} from '@/types';

const partOfSpeechSchema = z.enum(PART_OF_SPEECH_VALUES);
const verbFormSchema = z.enum(VERB_FORM_VALUES);
const nounFormSchema = z.enum(NOUN_FORM_VALUES);
const infinitiveUsageSchema = z.enum(INFINITIVE_USAGE_VALUES);

/** Token + TokenAnalysis の結合ビュー（TokenWithAnalysis 相当）。 */
export const tokenWithAnalysisSchema = z.object({
  id: z.string(),
  sentenceId: z.string(),
  text: z.string(),
  order: z.number(),
  memberTexts: z.array(z.string()).optional(),
  partOfSpeech: partOfSpeechSchema.nullable(),
  verbForm: verbFormSchema.nullable(),
  nounForm: nounFormSchema.nullable(),
  infinitiveUsage: infinitiveUsageSchema.nullable(),
  wordMeaning: z.string(),
  idiomMeaning: z.string(),
}) satisfies z.ZodType<TokenWithAnalysis>;

/** パターン（Pattern 相当）。構成トークンは 1 つ以上。 */
export const patternSchema = z.object({
  id: z.string(),
  tokenIds: z.array(z.string()).min(1),
  meaning: z.string(),
}) satisfies z.ZodType<Pattern>;

/** 英文エンティティ（Sentence 相当）。 */
export const sentenceSchema = z.object({
  id: z.string(),
  text: z.string(),
  tokens: z.array(tokenWithAnalysisSchema),
  patterns: z.array(patternSchema),
  naturalTranslation: z.string(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
}) satisfies z.ZodType<Sentence>;

/**
 * data.json から読み込む際のスキーマ。
 * 後から追加した naturalTranslation / tags / patterns / トークンの infinitiveUsage は古いデータに存在しないため、
 * 既定値で補完する（従来 store.ts の loadAll が手動で行っていた補完に相当）。
 */
const storedTokenSchema = tokenWithAnalysisSchema.extend({
  infinitiveUsage: infinitiveUsageSchema.nullable().default(null),
});

export const storedSentenceSchema = sentenceSchema.extend({
  tokens: z.array(storedTokenSchema),
  patterns: z.array(patternSchema).default([]),
  naturalTranslation: z.string().default(''),
  tags: z.array(z.string()).default([]),
});

export const storedSentencesSchema = z.array(storedSentenceSchema);

/** POST /sentences のリクエストボディ。 */
export const createSentenceBodySchema = z.object({
  id: z.string(),
  text: z.string(),
  tokens: z.array(tokenWithAnalysisSchema),
  tags: z.array(z.string()),
});

/** PUT /sentences/:id のリクエストボディ。パターンは同じボディ内のトークンだけを参照できる。 */
export const updateSentenceBodySchema = z
  .object({
    tokens: z.array(tokenWithAnalysisSchema),
    patterns: z.array(patternSchema),
    naturalTranslation: z.string(),
    tags: z.array(z.string()),
  })
  .refine(
    ({ tokens, patterns }) => {
      const tokenIds = new Set(tokens.map((t) => t.id));
      return patterns.every((pattern) => pattern.tokenIds.every((id) => tokenIds.has(id)));
    },
    { message: 'パターンが存在しないトークンを参照しています', path: ['patterns'] },
  );
