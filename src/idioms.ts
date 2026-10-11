/**
 * 慣用句（Idiom）の操作ユーティリティ。
 */
import type { Idiom, Token } from '@/types';

/** トークン ID の並びを英文中のトークン順に揃える（存在しない ID は除く）。 */
export function sortTokenIds(tokenIds: readonly string[], tokens: readonly Token[]): string[] {
  const ids = new Set(tokenIds);
  return tokens.filter((t) => ids.has(t.id)).map((t) => t.id);
}

/** 選択したトークンから新しい慣用句を作る（訳は未入力）。 */
export function createIdiom(tokenIds: readonly string[], tokens: readonly Token[]): Idiom {
  return { id: crypto.randomUUID(), tokenIds: sortTokenIds(tokenIds, tokens), meaning: '' };
}

/**
 * フレーズの結合・分解でトークンが入れ替わったとき、慣用句の参照を追従させる。
 *
 * removedIds のいずれかを含む慣用句には addedIds（結合後のフレーズ、または分解後の単語）を加え、
 * 新しいトークン一覧に存在しない ID は取り除く。構成トークンが無くなった慣用句は削除する。
 */
export function replaceIdiomTokens(
  idioms: readonly Idiom[],
  tokens: readonly Token[],
  removedIds: readonly string[],
  addedIds: readonly string[],
): Idiom[] {
  const removed = new Set(removedIds);
  return idioms
    .map((idiom) => {
      const affected = idiom.tokenIds.some((id) => removed.has(id));
      const tokenIds = affected ? [...idiom.tokenIds, ...addedIds] : idiom.tokenIds;
      return { ...idiom, tokenIds: sortTokenIds(tokenIds, tokens) };
    })
    .filter((idiom) => idiom.tokenIds.length > 0);
}

/**
 * 慣用句の表示テキスト。隣接していないトークンの間は「…」でつなぐ（例: "turn … off"）。
 */
export function idiomText(idiom: Idiom, tokens: readonly Token[]): string {
  const ids = new Set(idiom.tokenIds);
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
