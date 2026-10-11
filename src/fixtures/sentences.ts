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
  naturalTranslation: '私はその単語を辞書で調べた。',
  tags: ['過去文', '句動詞'],
  createdAt: '2026-10-01T09:00:00.000Z',
  updatedAt: '2026-10-02T09:00:00.000Z',
};

export const unanalyzedSentence: Sentence = {
  id: 's2',
  text: 'Nice to meet you.',
  tokens: wordTokens('s2', ['Nice', 'to', 'meet', 'you.']),
  naturalTranslation: '',
  tags: ['あいさつ文'],
  createdAt: '2026-10-03T09:00:00.000Z',
  updatedAt: '2026-10-03T09:00:00.000Z',
};

export const sampleSentences: Sentence[] = [analyzedSentence, unanalyzedSentence];

export const sampleTags: string[] = ['あいさつ文', '句動詞', '過去文'];
