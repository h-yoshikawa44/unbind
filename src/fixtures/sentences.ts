/**
 * Storybook などで使うサンプルデータ。
 */
import type { Sentence, TokenWithAnalysis } from '@/types';

/** 指定した英文の単語トークン（分析は未入力）を作る。 */
function wordTokens(sentenceId: string, words: string[]): TokenWithAnalysis[] {
  return words.map((text, order) => ({
    id: `${sentenceId}-t${order}`,
    sentenceId,
    text,
    order,
    partOfSpeech: null,
    verbForm: null,
    nounForm: null,
    infinitiveUsage: null,
    wordMeaning: '',
    idiomMeaning: '',
  }));
}

export const analyzedSentence: Sentence = {
  id: 's1',
  text: 'I looked up the word in a dictionary.',
  tokens: [
    {
      id: 's1-t0',
      sentenceId: 's1',
      text: 'I',
      order: 0,
      partOfSpeech: 'pronoun',
      verbForm: null,
      nounForm: null,
      infinitiveUsage: null,
      wordMeaning: '私は',
      idiomMeaning: '',
    },
    {
      id: 's1-t1',
      sentenceId: 's1',
      text: 'looked up',
      order: 1,
      memberTexts: ['looked', 'up'],
      partOfSpeech: 'verb',
      verbForm: 'past',
      nounForm: null,
      infinitiveUsage: null,
      wordMeaning: '',
      idiomMeaning: '調べた',
    },
    {
      id: 's1-t2',
      sentenceId: 's1',
      text: 'the',
      order: 2,
      partOfSpeech: 'definite-article',
      verbForm: null,
      nounForm: null,
      infinitiveUsage: null,
      wordMeaning: 'その',
      idiomMeaning: '',
    },
    {
      id: 's1-t3',
      sentenceId: 's1',
      text: 'word',
      order: 3,
      partOfSpeech: 'noun',
      verbForm: null,
      nounForm: 'singular',
      infinitiveUsage: null,
      wordMeaning: '単語',
      idiomMeaning: '',
    },
    ...wordTokens('s1', ['in', 'a', 'dictionary.']).map((token, i) => ({
      ...token,
      id: `s1-t${i + 4}`,
      order: i + 4,
    })),
  ],
  patterns: [],
  naturalTranslation: '私はその単語を辞書で調べた。',
  tags: ['過去文', '句動詞'],
  createdAt: '2026-10-01T09:00:00.000Z',
  updatedAt: '2026-10-02T09:00:00.000Z',
};

export const unanalyzedSentence: Sentence = {
  id: 's2',
  text: 'Nice to meet you.',
  tokens: wordTokens('s2', ['Nice', 'to', 'meet', 'you.']),
  patterns: [],
  naturalTranslation: '',
  tags: ['あいさつ文'],
  createdAt: '2026-10-03T09:00:00.000Z',
  updatedAt: '2026-10-03T09:00:00.000Z',
};

/** 隣接していない単語の組み合わせ（turn ... off）をパターンとして登録した英文。 */
export const patternSentence: Sentence = {
  id: 's3',
  text: 'Please turn the light off.',
  tokens: wordTokens('s3', ['Please', 'turn', 'the', 'light', 'off.']).map((token, i) => ({
    ...token,
    ...(
      [
        { partOfSpeech: 'adverb', wordMeaning: 'どうぞ' },
        { partOfSpeech: 'verb', verbForm: 'base', wordMeaning: '回す' },
        { partOfSpeech: 'definite-article', wordMeaning: 'その' },
        { partOfSpeech: 'noun', nounForm: 'singular', wordMeaning: '明かり' },
        { partOfSpeech: 'adverb', wordMeaning: '離れて' },
      ] satisfies Partial<TokenWithAnalysis>[]
    )[i],
  })),
  patterns: [{ id: 's3-p0', tokenIds: ['s3-t1', 's3-t4'], meaning: '（明かりなどを）消す' }],
  naturalTranslation: '明かりを消してください。',
  tags: ['命令文'],
  createdAt: '2026-10-04T09:00:00.000Z',
  updatedAt: '2026-10-04T09:00:00.000Z',
};

/** パターンが重なり合う英文（not only … but also の内側に turned … off / picked … up）。連結線の段組み確認用。 */
export const multiPatternSentence: Sentence = {
  id: 's4',
  text: 'She not only turned the radio off but also picked her bag up.',
  tokens: wordTokens('s4', [
    'She',
    'not',
    'only',
    'turned',
    'the',
    'radio',
    'off',
    'but',
    'also',
    'picked',
    'her',
    'bag',
    'up.',
  ]),
  patterns: [
    {
      id: 's4-p0',
      tokenIds: ['s4-t1', 's4-t2', 's4-t7', 's4-t8'],
      meaning: 'AだけでなくBも（追加を強調する相関接続詞）',
    },
    {
      id: 's4-p1',
      tokenIds: ['s4-t3', 's4-t6'],
      // 2 行を超える長さ（ラベルでは省略される）。
      meaning:
        '（ラジオ・明かり・テレビなどの電源を）切った、消した、止めた（スイッチを操作して動作を止めること全般）',
    },
    { id: 's4-p2', tokenIds: ['s4-t9', 's4-t12'], meaning: '' },
  ],
  naturalTranslation: '',
  tags: [],
  createdAt: '2026-10-05T09:00:00.000Z',
  updatedAt: '2026-10-05T09:00:00.000Z',
};

export const sampleSentences: Sentence[] = [analyzedSentence, unanalyzedSentence];

export const sampleTags: string[] = ['あいさつ文', '句動詞', '過去文'];
