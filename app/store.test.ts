import { describe, expect, it } from 'vite-plus/test';
import { unanalyzedSentence } from '@/fixtures/sentences';
import {
  createSentence,
  DATA_ERROR_MESSAGES,
  fetchAllTags,
  SentenceDataError,
  toDataErrorMessage,
} from './store';
import { createFakeKV } from './test/fake-kv';

// ルート経由（server.test.ts）では確かめられない部分だけをここで検証する。
describe('store', () => {
  it('createSentence は id を省略すると UUID を採番する', async () => {
    const fake = createFakeKV();

    const sentence = await createSentence(fake.kv, 'Hello.', []);

    expect(sentence.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(sentence.tags).toEqual([]);
    expect(fake.savedSentences()).toEqual([sentence]);
  });

  it('fetchAllTags は日本語の照合順に並べる', async () => {
    const fake = createFakeKV({
      sentences: [
        { ...unanalyzedSentence, id: 'a', tags: ['過去文', 'question', 'あいさつ文'] },
        { ...unanalyzedSentence, id: 'b', tags: ['Answer', '句動詞', 'あいさつ文'] },
      ],
    });

    expect(await fetchAllTags(fake.kv)).toEqual([
      'Answer',
      'question',
      'あいさつ文',
      '過去文',
      '句動詞',
    ]);
  });

  describe('toDataErrorMessage', () => {
    it.each(['read', 'validation'] as const)(
      'SentenceDataError（%s）はその種別のメッセージを返す',
      (kind) => {
        const err = new SentenceDataError(kind);
        expect(err.kind).toBe(kind);
        expect(toDataErrorMessage(err)).toBe(DATA_ERROR_MESSAGES[kind]);
      },
    );

    it('想定外のエラーは取得失敗として扱う', () => {
      expect(toDataErrorMessage(new Error('boom'))).toBe(DATA_ERROR_MESSAGES.read);
      expect(toDataErrorMessage('string error')).toBe(DATA_ERROR_MESSAGES.read);
    });
  });
});
