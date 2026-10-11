/**
 * 英文のトークン化ユーティリティ。
 *
 * 現在は空白文字で単純に分割している。
 * 将来的にはサーバーサイドへ移行し、NLP ライブラリ (spaCy, NLTK など) を用いた
 * 自動品詞タグ付けやより高度なトークン化を実現することを想定している。
 */
import type { TokenWithAnalysis } from '@/types';

/** 英文を空白文字で分割し、単語トークンの配列を返す。 */
export function tokenize(sentenceId: string, text: string): TokenWithAnalysis[] {
  const regex = /\S+/g;
  const result: TokenWithAnalysis[] = [];
  let match: RegExpExecArray | null;
  let order = 0;

  while ((match = regex.exec(text)) !== null) {
    result.push({
      id: crypto.randomUUID(),
      sentenceId,
      text: match[0],
      order: order++,
      partOfSpeech: null,
      verbForm: null,
      nounForm: null,
      infinitiveUsage: null,
      wordMeaning: '',
      idiomMeaning: '',
    });
  }

  return result;
}

/**
 * 隣接する複数のトークンを1つのフレーズトークンに結合する。
 * 指定した ids はトークンリスト内で連続している必要がある。
 */
export function mergeTokens(tokens: TokenWithAnalysis[], ids: string[]): TokenWithAnalysis[] {
  const indices = ids.map((id) => tokens.findIndex((t) => t.id === id)).sort((a, b) => a - b);

  const first = indices[0];
  const last = indices[indices.length - 1];

  for (let i = 1; i < indices.length; i++) {
    if (indices[i] !== indices[i - 1] + 1) {
      throw new Error('Tokens must be adjacent to merge');
    }
  }

  const toMerge = tokens.slice(first, last + 1);
  // 選択トークンにすでにフレーズが含まれる場合は memberTexts を展開してフラット化する
  const memberTexts = toMerge.flatMap((t) => t.memberTexts ?? [t.text]);

  const phraseToken: TokenWithAnalysis = {
    id: crypto.randomUUID(),
    sentenceId: tokens[first].sentenceId,
    text: memberTexts.join(' '),
    order: tokens[first].order,
    memberTexts,
    partOfSpeech: null,
    verbForm: null,
    nounForm: null,
    infinitiveUsage: null,
    wordMeaning: '',
    idiomMeaning: '',
  };

  return [...tokens.slice(0, first), phraseToken, ...tokens.slice(last + 1)];
}

/**
 * フレーズトークンを元の個別単語トークンに分解する。
 * フレーズでないトークン (memberTexts が存在しない) には何もしない。
 */
export function splitToken(tokens: TokenWithAnalysis[], id: string): TokenWithAnalysis[] {
  const idx = tokens.findIndex((t) => t.id === id);
  if (idx === -1) return tokens;

  const token = tokens[idx];
  if (!token.memberTexts || token.memberTexts.length <= 1) return tokens;

  const individual: TokenWithAnalysis[] = token.memberTexts.map((text, i) => ({
    id: crypto.randomUUID(),
    sentenceId: token.sentenceId,
    text,
    order: token.order + i,
    partOfSpeech: null,
    verbForm: null,
    nounForm: null,
    infinitiveUsage: null,
    wordMeaning: '',
    idiomMeaning: '',
  }));

  return [...tokens.slice(0, idx), ...individual, ...tokens.slice(idx + 1)];
}
