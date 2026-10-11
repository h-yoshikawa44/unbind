/**
 * テスト用のインメモリ KV。store.ts が使う get(key, 'text') / put だけを実装する。
 */
import type { KVNamespace } from '@cloudflare/workers-types';
import type { Sentence } from '@/types';
import { storedSentencesSchema } from '@/schemas';

// store.ts が保存に使うキー。
const DATA_KEY = 'sentences';

interface FakeKVOptions {
  /** KV に入れておく生の文字列（JSON 破損などの再現用）。 */
  raw?: string;
  /** KV に入れておく英文。 */
  sentences?: unknown[];
  /** true にすると get が失敗する（KV I/O エラーの再現用）。 */
  failOnGet?: boolean;
}

export function createFakeKV({ raw, sentences, failOnGet = false }: FakeKVOptions = {}) {
  const store = new Map<string, string>();
  if (raw !== undefined) store.set(DATA_KEY, raw);
  if (sentences !== undefined) store.set(DATA_KEY, JSON.stringify(sentences));

  const fake = {
    async get(key: string): Promise<string | null> {
      if (failOnGet) throw new Error('KV get failed');
      return store.get(key) ?? null;
    },
    async put(key: string, value: string): Promise<void> {
      store.set(key, value);
    },
  };

  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- store.ts が使う get/put だけを実装した部分的な KV で足りるため
    kv: fake as unknown as KVNamespace,
    /** KV に保存されている英文（保存形式のスキーマで検証して返す）。 */
    savedSentences(): Sentence[] {
      const text = store.get(DATA_KEY);
      if (text === undefined) throw new Error('KV に英文が保存されていません');
      return storedSentencesSchema.parse(JSON.parse(text));
    },
    /** KV に保存されている生の文字列（未保存なら undefined）。 */
    rawValue(): string | undefined {
      return store.get(DATA_KEY);
    },
  };
}
