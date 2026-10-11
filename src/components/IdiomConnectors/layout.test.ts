import { describe, expect, it } from 'vite-plus/test';
import type { Idiom, Token } from '@/types';
import type { ChipBox } from '@/components/IdiomConnectors/layout';
import { layoutIdiomConnectors } from '@/components/IdiomConnectors/layout';

// 幅 400px の領域。チップは幅 40px・高さ 30px、行の高さは 100px 間隔とする。
const WIDTH = 400;

function token(id: string): Token {
  return { id, sentenceId: 's', text: id, order: 0 };
}

function idiom(id: string, tokenIds: string[], meaning = ''): Idiom {
  return { id, tokenIds, meaning };
}

/** [トークン ID, 左端, 行番号] からチップの位置を作る。 */
function boxes(...chips: [string, number, number][]): Map<string, ChipBox> {
  return new Map(
    chips.map(([id, left, row]) => [id, { left, top: row * 100, width: 40, height: 30 }]),
  );
}

const tokens = ['a', 'b', 'c', 'd', 'e'].map(token);

describe('layoutIdiomConnectors', () => {
  it('同じ行の離れたトークンを、両端のチップ中央を結ぶ線でつなぐ', () => {
    const layout = layoutIdiomConnectors(
      [idiom('i1', ['a', 'c'], '消す')],
      tokens,
      boxes(['a', 0, 0], ['b', 50, 0], ['c', 100, 0]),
      WIDTH,
    );

    // チップ下端 30 + 1 段目のオフセット 12。
    expect(layout.segments).toEqual([
      { key: 'i1-0', idiomId: 'i1', x1: 20, x2: 120, y: 42, openStart: false, openEnd: false },
    ]);
    expect(layout.ticks).toEqual([
      { key: 'i1-a', idiomId: 'i1', x: 20, y1: 30, y2: 42 },
      { key: 'i1-c', idiomId: 'i1', x: 120, y1: 30, y2: 42 },
    ]);
    expect(layout.labels).toEqual([{ idiomId: 'i1', number: 1, meaning: '消す', x: 70, y: 42 }]);
    expect(layout.laneCount).toBe(1);
  });

  it('行をまたぐ慣用句は行ごとに線を分け、続く側を行端まで伸ばす', () => {
    const layout = layoutIdiomConnectors(
      [idiom('i1', ['b', 'd'])],
      tokens,
      // c で折り返して 2 行目になる。
      boxes(['a', 0, 0], ['b', 50, 0], ['c', 0, 1], ['d', 50, 1]),
      WIDTH,
    );

    expect(layout.segments).toEqual([
      { key: 'i1-0', idiomId: 'i1', x1: 70, x2: WIDTH, y: 42, openStart: false, openEnd: true },
      { key: 'i1-1', idiomId: 'i1', x1: 0, x2: 70, y: 142, openStart: true, openEnd: false },
    ]);
    // ラベルは最初の行にだけ置く。
    expect(layout.labels.map((l) => l.y)).toEqual([42]);
  });

  it('同じ行で重なる慣用句は段を分け、重ならなければ同じ段に並べる', () => {
    const layout = layoutIdiomConnectors(
      [idiom('i1', ['a', 'c']), idiom('i2', ['b', 'd']), idiom('i3', ['e', 'e'])],
      tokens,
      boxes(['a', 0, 0], ['b', 50, 0], ['c', 100, 0], ['d', 150, 0], ['e', 300, 0]),
      WIDTH,
    );

    expect(layout.segments.map((s) => [s.key, s.y])).toEqual([
      ['i1-0', 42],
      ['i2-0', 66],
      ['i3-0', 42],
    ]);
    expect(layout.laneCount).toBe(2);
  });

  it('入れ子の慣用句は内側（短い線）を上の段にする', () => {
    const layout = layoutIdiomConnectors(
      [idiom('outer', ['a', 'e']), idiom('inner', ['b', 'c'])],
      tokens,
      boxes(['a', 0, 0], ['b', 100, 0], ['c', 150, 0], ['d', 200, 0], ['e', 300, 0]),
      WIDTH,
    );

    expect(layout.segments.map((s) => [s.key, s.y])).toEqual([
      ['outer-0', 66],
      ['inner-0', 42],
    ]);
  });

  it('ラベルが領域の端からはみ出さないよう中心を寄せる', () => {
    const layout = layoutIdiomConnectors(
      [idiom('i1', ['a', 'b'])],
      tokens,
      boxes(['a', 0, 0], ['b', 10, 0]),
      WIDTH,
    );

    expect(layout.labels[0].x).toBe(48);
  });

  it('2 行に折り返したラベルがあると、その高さに合わせて段の間隔と行の下の余白を広げる', () => {
    const layout = layoutIdiomConnectors(
      [idiom('i1', ['a', 'c']), idiom('i2', ['b', 'd'])],
      tokens,
      boxes(['a', 0, 0], ['b', 50, 0], ['c', 100, 0], ['d', 150, 0]),
      WIDTH,
      new Map([['i1', { width: 96, height: 40 }]]),
    );

    // 1 段目はラベルの上半分（20）+ 4 だけチップ下端（30）から離し、段の間隔はラベルの高さ + 6。
    expect(layout.segments.map((s) => [s.key, s.y])).toEqual([
      ['i1-0', 54],
      ['i2-0', 100],
    ]);
    // 1 段目まで 24 + 2 段目まで 46 + 最終段のラベルの下半分と余白 28。
    expect(layout.space).toBe(98);
  });

  it('ラベルが 1 行なら段の間隔は既定のまま', () => {
    const layout = layoutIdiomConnectors(
      [idiom('i1', ['a', 'c'])],
      tokens,
      boxes(['a', 0, 0], ['c', 100, 0]),
      WIDTH,
      new Map([['i1', { width: 96, height: 16 }]]),
    );

    expect(layout.segments[0].y).toBe(42);
    expect(layout.space).toBe(36);
  });

  it('線より幅の広いラベルは、ラベルの幅ぶんを占有するとみなして段を分ける', () => {
    const chips = boxes(['a', 0, 0], ['b', 50, 0], ['c', 150, 0], ['d', 200, 0]);
    const idioms = [idiom('i1', ['a', 'b']), idiom('i2', ['c', 'd'])];

    // 既定の幅（96）なら離れているので同じ段に並ぶ。
    expect(layoutIdiomConnectors(idioms, tokens, chips, WIDTH).segments.map((s) => s.y)).toEqual([
      42, 42,
    ]);

    const wide = layoutIdiomConnectors(
      idioms,
      tokens,
      chips,
      WIDTH,
      new Map([['i1', { width: 200, height: 16 }]]),
    );
    expect(wide.segments.map((s) => s.y)).toEqual([42, 66]);
    // 幅 200 のラベルが左端からはみ出さないよう、中心を 100 に寄せる。
    expect(wide.labels[0].x).toBe(100);
  });

  it('位置が分からないトークンは無視し、慣用句が無ければ何も描かない', () => {
    expect(
      layoutIdiomConnectors([idiom('i1', ['x', 'y'])], tokens, boxes(['a', 0, 0]), WIDTH),
    ).toEqual({ segments: [], ticks: [], labels: [], laneCount: 0, space: 0 });
  });
});
