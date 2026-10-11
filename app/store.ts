/**
 * 英文データのサーバ側ストア。
 *
 * ストレージには Cloudflare KV を使用している（全 sentences を 1 キーに
 * JSON 配列で保存）。バインディングは Workers の実行コンテキスト（c.env）
 * からしか取得できないため、各関数は第 1 引数に KVNamespace を受け取る。
 * バックエンドに DB（D1 等）を導入する際は各関数の中身を差し替える。
 * 関数シグネチャと戻り値の型は REST API 形に寄せてある。
 */
import type { KVNamespace } from '@cloudflare/workers-types';
import type { Pattern, Sentence, TokenWithAnalysis } from '@/types';
import { normalizeTags } from '@/types';
import { storedSentencesSchema } from '@/schemas';

// 全 sentences を格納する KV のキー。
const DATA_KEY = 'sentences';

/** データ層のエラー種別ごとのユーザ向けメッセージ。 */
export const DATA_ERROR_MESSAGES = {
  // 読み込み自体に失敗した（KV I/O など想定外の失敗）。
  read: 'データの取得に失敗しました',
  // 読み込めたが中身が期待する形と違う（JSON 破損・スキーマ検証エラー）。
  validation: '予期しないデータが取得されました',
} as const;

/**
 * データ層で発生したユーザに提示すべきエラー。
 * message にはそのまま画面表示できる日本語メッセージを持たせる。
 */
export class SentenceDataError extends Error {
  kind: 'read' | 'validation';

  constructor(kind: 'read' | 'validation') {
    super(DATA_ERROR_MESSAGES[kind]);
    this.name = 'SentenceDataError';
    this.kind = kind;
  }
}

/** 任意のエラーを画面表示用メッセージへ変換する（想定外は取得失敗として扱う）。 */
export function toDataErrorMessage(err: unknown): string {
  return err instanceof SentenceDataError ? err.message : DATA_ERROR_MESSAGES.read;
}

async function loadAll(kv: KVNamespace): Promise<Sentence[]> {
  let text: string | null;
  try {
    text = await kv.get(DATA_KEY, 'text');
  } catch (err) {
    // KV 読み込み自体の失敗は取得エラーとして通知する。
    console.error('KV の読み込みに失敗しました:', err);
    throw new SentenceDataError('read');
  }
  // 未保存（初回）はキーが存在せず null になる。空データとして扱う。
  if (text === null) return [];
  // ここで検証して初めて Sentence[] とみなす。
  // naturalTranslation / tags / patterns が無い古いデータはスキーマ側の既定値で補完される。
  // JSON 破損・スキーマ不一致は握りつぶさず、検証エラーとして通知する。
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (err) {
    console.error('KV データのパースに失敗しました:', err);
    throw new SentenceDataError('validation');
  }
  const result = storedSentencesSchema.safeParse(json);
  if (!result.success) {
    console.error('KV データがスキーマに一致しません:', result.error);
    throw new SentenceDataError('validation');
  }
  return result.data;
}

async function saveAll(kv: KVNamespace, sentences: Sentence[]): Promise<void> {
  await kv.put(DATA_KEY, JSON.stringify(sentences));
}

/** GET /api/sentences 相当 - 英文一覧を取得する（最終更新日の降順） */
export async function fetchSentences(kv: KVNamespace): Promise<Sentence[]> {
  const sentences = await loadAll(kv);
  return sentences.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** GET /api/sentences/:id 相当 - 単一の英文を取得する（無ければ null） */
export async function fetchSentence(kv: KVNamespace, id: string): Promise<Sentence | null> {
  const sentences = await loadAll(kv);
  return sentences.find((s) => s.id === id) ?? null;
}

/** POST /api/sentences 相当 - 英文を新規作成する */
export async function createSentence(
  kv: KVNamespace,
  text: string,
  tokens: TokenWithAnalysis[],
  tags: string[] = [],
  id: string = crypto.randomUUID(),
): Promise<Sentence> {
  const sentences = await loadAll(kv);
  const now = new Date().toISOString();
  const sentence: Sentence = {
    id,
    text,
    tokens,
    patterns: [],
    naturalTranslation: '',
    tags: normalizeTags(tags),
    createdAt: now,
    updatedAt: now,
  };
  await saveAll(kv, [...sentences, sentence]);
  return sentence;
}

/** PUT /api/sentences/:id 相当 - 英文のトークン分析データ・パターンを更新する */
export async function updateSentence(
  kv: KVNamespace,
  id: string,
  tokens: TokenWithAnalysis[],
  patterns: Pattern[],
  naturalTranslation: string,
  tags: string[],
): Promise<Sentence> {
  const sentences = await loadAll(kv);
  const idx = sentences.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error(`Sentence ${id} not found`);
  const updated: Sentence = {
    ...sentences[idx],
    tokens,
    patterns,
    naturalTranslation,
    tags: normalizeTags(tags),
    updatedAt: new Date().toISOString(),
  };
  sentences[idx] = updated;
  await saveAll(kv, sentences);
  return updated;
}

/** DELETE /api/sentences/:id 相当 - 英文を削除する */
export async function deleteSentence(kv: KVNamespace, id: string): Promise<void> {
  const sentences = await loadAll(kv);
  await saveAll(
    kv,
    sentences.filter((s) => s.id !== id),
  );
}

/** GET /api/tags 相当 - 使用中のタグ一覧（重複なし・50音/アルファベット順）を取得する */
export async function fetchAllTags(kv: KVNamespace): Promise<string[]> {
  const sentences = await loadAll(kv);
  const tagSet = new Set<string>();
  for (const sentence of sentences) {
    for (const tag of sentence.tags) tagSet.add(tag);
  }
  return [...tagSet].sort((a, b) => a.localeCompare(b, 'ja'));
}
