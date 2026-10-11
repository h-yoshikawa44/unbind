import type { KVNamespace } from '@cloudflare/workers-types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import type { Sentence } from '@/types';
import { analyzedSentence, unanalyzedSentence } from '@/fixtures/sentences';
import app from './server';
import { DATA_ERROR_MESSAGES } from './store';
import { createFakeKV } from './test/fake-kv';

const NOW = '2026-10-11T00:00:00.000Z';

// older / newer が持つタグを日本語の照合順（localeCompare 'ja'）に並べたもの。漢字は JIS 順なので「過」が「句」より先。
const ALL_TAGS = ['あいさつ文', '過去文', '句動詞'];

/** Inertia クライアントとして GET し、ページオブジェクト（JSON）を受け取る。 */
async function visit(kv: KVNamespace, path: string) {
  const res = await app.request(path, { headers: { 'X-Inertia': 'true' } }, { UNBIND_KV: kv });
  const page: unknown = await res.json();
  return { res, page };
}

/** JSON ボディ付きで POST / PUT / DELETE する（Inertia の router.post 等と同じ形）。 */
function send(kv: KVNamespace, method: string, path: string, body?: unknown) {
  return app.request(
    path,
    {
      method,
      headers: { 'X-Inertia': 'true', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    { UNBIND_KV: kv },
  );
}

/** エラーページのページオブジェクト。 */
function errorPage(message: string) {
  return expect.objectContaining({ component: 'Error', props: { message } });
}

const older: Sentence = { ...unanalyzedSentence, updatedAt: '2026-09-01T00:00:00.000Z' };
const newer: Sentence = { ...analyzedSentence, updatedAt: '2026-10-01T00:00:00.000Z' };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  // データ異常時に store.ts が出すログをテスト出力に混ぜない（呼ばれたかは個別に検証する）。
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('GET /（英文一覧）', () => {
  it('英文を更新日の新しい順に、使用中のタグを重複なしで渡す', async () => {
    const { kv } = createFakeKV({ sentences: [older, newer] });

    const { res, page } = await visit(kv, '/');

    expect(res.status).toBe(200);
    expect(page).toEqual(
      expect.objectContaining({
        component: 'Sentences/Index',
        url: '/',
        props: { sentences: [newer, older], allTags: ALL_TAGS },
      }),
    );
  });

  it('KV が未保存（初回）なら空の一覧を渡す', async () => {
    const { kv } = createFakeKV();

    const { page } = await visit(kv, '/');

    expect(page).toEqual(expect.objectContaining({ props: { sentences: [], allTags: [] } }));
  });

  it('naturalTranslation / tags が無い古いデータは既定値で補完する', async () => {
    const { naturalTranslation: _n, tags: _t, ...legacy } = unanalyzedSentence;
    const { kv } = createFakeKV({ sentences: [legacy] });

    const { page } = await visit(kv, '/');

    expect(page).toEqual(
      expect.objectContaining({
        props: {
          sentences: [{ ...unanalyzedSentence, naturalTranslation: '', tags: [] }],
          allTags: [],
        },
      }),
    );
  });

  it('KV の JSON が壊れていればエラーページを表示する', async () => {
    const { kv } = createFakeKV({ raw: '{broken' });

    const { res, page } = await visit(kv, '/');

    expect(res.status).toBe(200);
    expect(page).toEqual(errorPage(DATA_ERROR_MESSAGES.validation));
    expect(console.error).toHaveBeenCalled();
  });

  it('KV のデータがスキーマに一致しなければエラーページを表示する', async () => {
    const { kv } = createFakeKV({
      sentences: [{ ...analyzedSentence, tokens: [{ text: 'no id' }] }],
    });

    const { page } = await visit(kv, '/');

    expect(page).toEqual(errorPage(DATA_ERROR_MESSAGES.validation));
  });

  it('KV の読み込み自体に失敗したらエラーページを表示する', async () => {
    const { kv } = createFakeKV({ failOnGet: true });

    const { page } = await visit(kv, '/');

    expect(page).toEqual(errorPage(DATA_ERROR_MESSAGES.read));
  });

  it('Inertia 以外の通常リクエストには、初期ページを埋め込んだ HTML を返す', async () => {
    const { kv } = createFakeKV({ sentences: [newer] });

    const res = await app.request('/', {}, { UNBIND_KV: kv });
    const html = await res.text();

    expect(res.headers.get('Content-Type')).toContain('text/html');
    const json = /<script data-page="app" type="application\/json">(.*?)<\/script>/s.exec(
      html,
    )?.[1];
    if (json === undefined) throw new Error('初期ページの script が見つかりません');
    const page: unknown = JSON.parse(json);
    expect(page).toEqual(
      expect.objectContaining({ component: 'Sentences/Index', props: expect.anything() }),
    );
  });
});

describe('GET /sentences/new（新規作成フォーム）', () => {
  it('入力候補として使用中のタグを渡す', async () => {
    const { kv } = createFakeKV({ sentences: [older, newer] });

    const { page } = await visit(kv, '/sentences/new');

    expect(page).toEqual(
      expect.objectContaining({
        component: 'Sentences/New',
        props: { tagSuggestions: ALL_TAGS },
      }),
    );
  });

  it('データ異常時はエラーページを表示する', async () => {
    const { kv } = createFakeKV({ raw: 'null' });

    const { page } = await visit(kv, '/sentences/new');

    expect(page).toEqual(errorPage(DATA_ERROR_MESSAGES.validation));
  });
});

describe('GET /sentences/:id（英文詳細）', () => {
  it('id に一致する英文と、入力候補のタグを渡す', async () => {
    const { kv } = createFakeKV({ sentences: [older, newer] });

    const { page } = await visit(kv, `/sentences/${newer.id}`);

    expect(page).toEqual(
      expect.objectContaining({
        component: 'Sentences/Show',
        props: { sentence: newer, tagSuggestions: ALL_TAGS },
      }),
    );
  });

  it('存在しない id なら sentence を null で渡す', async () => {
    const { kv } = createFakeKV({ sentences: [older] });

    const { page } = await visit(kv, '/sentences/unknown');

    expect(page).toEqual(
      expect.objectContaining({
        component: 'Sentences/Show',
        props: { sentence: null, tagSuggestions: ['あいさつ文'] },
      }),
    );
  });

  it('データ異常時はエラーページを表示する', async () => {
    const { kv } = createFakeKV({ failOnGet: true });

    const { page } = await visit(kv, `/sentences/${newer.id}`);

    expect(page).toEqual(errorPage(DATA_ERROR_MESSAGES.read));
  });
});

describe('POST /sentences（新規作成）', () => {
  const body = {
    id: 'new-id',
    text: 'Good morning.',
    tokens: [{ ...unanalyzedSentence.tokens[0], sentenceId: 'new-id', text: 'Good' }],
    tags: [' あいさつ文 ', 'あいさつ文', ''],
  };

  it('英文を保存し、作成した英文の詳細へ 303 でリダイレクトする', async () => {
    const fake = createFakeKV({ sentences: [older] });

    const res = await send(fake.kv, 'POST', '/sentences', body);

    expect(res.status).toBe(303);
    expect(res.headers.get('Location')).toBe('/sentences/new-id');
    expect(fake.savedSentences()).toEqual([
      older,
      {
        id: 'new-id',
        text: 'Good morning.',
        tokens: body.tokens,
        naturalTranslation: '',
        // タグは前後の空白除去・空文字除外・重複排除される。
        tags: ['あいさつ文'],
        createdAt: NOW,
        updatedAt: NOW,
      },
    ]);
  });

  it('KV が未保存（初回）でも作成できる', async () => {
    const fake = createFakeKV();

    const res = await send(fake.kv, 'POST', '/sentences', body);

    expect(res.status).toBe(303);
    expect(fake.savedSentences().map((s) => s.id)).toEqual(['new-id']);
  });

  it.each([
    ['text が無い', { ...body, text: undefined }],
    ['tags が配列でない', { ...body, tags: 'あいさつ文' }],
    ['品詞が不正', { ...body, tokens: [{ ...body.tokens[0], partOfSpeech: 'verbb' }] }],
  ])('ボディが不正（%s）なら 400 を返し、保存しない', async (_, invalid) => {
    const fake = createFakeKV({ sentences: [older] });

    const res = await send(fake.kv, 'POST', '/sentences', invalid);

    expect(res.status).toBe(400);
    expect(fake.savedSentences()).toEqual([older]);
  });

  it('既存データが壊れていれば上書きせず、エラーページを表示する', async () => {
    const fake = createFakeKV({ raw: '{broken' });

    const res = await send(fake.kv, 'POST', '/sentences', body);
    const page: unknown = await res.json();

    expect(page).toEqual(errorPage(DATA_ERROR_MESSAGES.validation));
    expect(fake.rawValue()).toBe('{broken');
  });
});

describe('PUT /sentences/:id（更新）', () => {
  const body = {
    tokens: newer.tokens.map((t) => ({ ...t, wordMeaning: `${t.text} の意味` })),
    naturalTranslation: '辞書で単語を調べた。',
    tags: ['過去文', ' 辞書 ', '過去文'],
  };

  it('トークン・意訳・タグと更新日時を更新し、詳細へ 303 でリダイレクトする', async () => {
    const fake = createFakeKV({ sentences: [older, newer] });

    const res = await send(fake.kv, 'PUT', `/sentences/${newer.id}`, body);

    expect(res.status).toBe(303);
    expect(res.headers.get('Location')).toBe(`/sentences/${newer.id}`);
    expect(fake.savedSentences()).toEqual([
      older,
      {
        ...newer,
        tokens: body.tokens,
        naturalTranslation: '辞書で単語を調べた。',
        tags: ['過去文', '辞書'],
        // 作成日時・英文は変えず、更新日時だけ進める。
        createdAt: newer.createdAt,
        updatedAt: NOW,
      },
    ]);
  });

  it('存在しない id ならエラーページを表示し、保存しない', async () => {
    const fake = createFakeKV({ sentences: [older] });

    const res = await send(fake.kv, 'PUT', '/sentences/unknown', body);
    const page: unknown = await res.json();

    expect(page).toEqual(errorPage(DATA_ERROR_MESSAGES.read));
    expect(fake.savedSentences()).toEqual([older]);
  });

  it('ボディが不正なら 400 を返し、保存しない', async () => {
    const fake = createFakeKV({ sentences: [newer] });

    const res = await send(fake.kv, 'PUT', `/sentences/${newer.id}`, {
      ...body,
      naturalTranslation: 123,
    });

    expect(res.status).toBe(400);
    expect(fake.savedSentences()).toEqual([newer]);
  });
});

describe('DELETE /sentences/:id（削除）', () => {
  it('英文を削除し、一覧へ 303 でリダイレクトする', async () => {
    const fake = createFakeKV({ sentences: [older, newer] });

    const res = await send(fake.kv, 'DELETE', `/sentences/${newer.id}`);

    expect(res.status).toBe(303);
    expect(res.headers.get('Location')).toBe('/');
    expect(fake.savedSentences()).toEqual([older]);
  });

  it('存在しない id なら何も消さずにリダイレクトする', async () => {
    const fake = createFakeKV({ sentences: [older] });

    const res = await send(fake.kv, 'DELETE', '/sentences/unknown');

    expect(res.status).toBe(303);
    expect(fake.savedSentences()).toEqual([older]);
  });

  it('KV の読み込みに失敗したらエラーページを表示する', async () => {
    const fake = createFakeKV({ failOnGet: true });

    const res = await send(fake.kv, 'DELETE', `/sentences/${newer.id}`);
    const page: unknown = await res.json();

    expect(page).toEqual(errorPage(DATA_ERROR_MESSAGES.read));
  });
});
