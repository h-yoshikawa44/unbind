/**
 * パターン（Pattern）の操作ユーティリティ。
 */
import type { Pattern, Token } from '@/types';

/** トークン ID の並びを英文中のトークン順に揃える（存在しない ID は除く）。 */
export function sortTokenIds(tokenIds: readonly string[], tokens: readonly Token[]): string[] {
  const ids = new Set(tokenIds);
  return tokens.filter((t) => ids.has(t.id)).map((t) => t.id);
}

/** 選択したトークンから新しいパターンを作る（訳は未入力）。 */
export function createPattern(tokenIds: readonly string[], tokens: readonly Token[]): Pattern {
  return { id: crypto.randomUUID(), tokenIds: sortTokenIds(tokenIds, tokens), meaning: '' };
}

/**
 * フレーズの結合・分解でトークンが入れ替わったとき、パターンの参照を追従させる。
 *
 * removedIds のいずれかを含むパターンには addedIds（結合後のフレーズ、または分解後の単語）を加え、
 * 新しいトークン一覧に存在しない ID は取り除く。構成トークンが無くなったパターンは削除する。
 */
export function replacePatternTokens(
  patterns: readonly Pattern[],
  tokens: readonly Token[],
  removedIds: readonly string[],
  addedIds: readonly string[],
): Pattern[] {
  const removed = new Set(removedIds);
  return patterns
    .map((pattern) => {
      const affected = pattern.tokenIds.some((id) => removed.has(id));
      const tokenIds = affected ? [...pattern.tokenIds, ...addedIds] : pattern.tokenIds;
      return { ...pattern, tokenIds: sortTokenIds(tokenIds, tokens) };
    })
    .filter((pattern) => pattern.tokenIds.length > 0);
}

/**
 * パターンの表示テキスト。隣接していないトークンの間は「…」でつなぐ（例: "turn … off"）。
 */
export function patternText(pattern: Pattern, tokens: readonly Token[]): string {
  const ids = new Set(pattern.tokenIds);
  const parts: string[] = [];
  let prevIndex: number | null = null;
  tokens.forEach((token, index) => {
    if (!ids.has(token.id)) return;
    if (prevIndex !== null) parts.push(index === prevIndex + 1 ? ' ' : ' … ');
    parts.push(token.text);
    prevIndex = index;
  });
  return parts.join('');
}
