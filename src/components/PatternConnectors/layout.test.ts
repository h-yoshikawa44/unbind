import { describe, expect, it } from 'vite-plus/test';
import type { Pattern, Token } from '@/types';
import type { ChipBox } from '@/components/PatternConnectors/layout';
import { layoutPatternConnectors } from '@/components/PatternConnectors/layout';

// 幅 400px の領域。チップは幅 40px・高さ 30px、行の高さは 100px 間隔とする。
const WIDTH = 400;

function token(id: string): Token {
  return { id, sentenceId: 's', text: id, order: 0 };
}

function pattern(id: string, tokenIds: string[], meaning = ''): Pattern {
  return { id, tokenIds, meaning };
}

/** [トークン ID, 左端, 行番号] からチップの位置を作る。 */
function boxes(...chips: [string, number, number][]): Map<string, ChipBox> {
  return new Map(
    chips.map(([id, left, row]) => [id, { left, top: row * 100, width: 40, height: 30 }]),
  );
}

const tokens = ['a', 'b', 'c', 'd', 'e'].map(token);

describe('layoutPatternConnectors', () => {
  it('同じ行の離れたトークンを、両端のチップ中央を結ぶ線でつなぐ', () => {
    const layout = layoutPatternConnectors(
      [pattern('i1', ['a', 'c'], '消す')],
      tokens,
      boxes(['a', 0, 0], ['b', 50, 0], ['c', 100, 0]),
      WIDTH,
    );

    // チップ下端 30 + 1 段目のオフセット 12。
    expect(layout.segments).toEqual([
      { key: 'i1-0', patternId: 'i1', x1: 20, x2: 120, y: 42, openStart: false, openEnd: false },
    ]);
    expect(layout.ticks).toEqual([
      { key: 'i1-a', patternId: 'i1', x: 20, y1: 30, y2: 42 },
      { key: 'i1-c', patternId: 'i1', x: 120, y1: 30, y2: 42 },
    ]);
    expect(layout.labels).toEqual([{ patternId: 'i1', number: 1, meaning: '消す', x: 70, y: 42 }]);
    expect(layout.laneCount).toBe(1);
  });

  it('行をまたぐパターンは行ごとに線を分け、続く側を行端まで伸ばす', () => {
    const layout = layoutPatternConnectors(
      [pattern('i1', ['b', 'd'])],
      tokens,
      // c で折り返して 2 行目になる。
      boxes(['a', 0, 0], ['b', 50, 0], ['c', 0, 1], ['d', 50, 1]),
      WIDTH,
    );

    expect(layout.segments).toEqual([
      { key: 'i1-0', patternId: 'i1', x1: 70, x2: WIDTH, y: 42, openStart: false, openEnd: true },
      { key: 'i1-1', patternId: 'i1', x1: 0, x2: 70, y: 142, openStart: true, openEnd: false },
    ]);
    // ラベルは最初の行にだけ置く。
    expect(layout.labels.map((l) => l.y)).toEqual([42]);
  });

  it('同じ行で重なるパターンは段を分け、重ならなければ同じ段に並べる', () => {
    const layout = layoutPatternConnectors(
      [pattern('i1', ['a', 'c']), pattern('i2', ['b', 'd']), pattern('i3', ['e', 'e'])],
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

  it('入れ子のパターンは内側（短い線）を上の段にする', () => {
    const layout = layoutPatternConnectors(
      [pattern('outer', ['a', 'e']), pattern('inner', ['b', 'c'])],
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
    const layout = layoutPatternConnectors(
      [pattern('i1', ['a', 'b'])],
      tokens,
      boxes(['a', 0, 0], ['b', 10, 0]),
      WIDTH,
    );

    expect(layout.labels[0].x).toBe(48);
  });

  it('2 行に折り返したラベルがあると、その高さに合わせて段の間隔と行の下の余白を広げる', () => {
    const layout = layoutPatternConnectors(
      [pattern('i1', ['a', 'c']), pattern('i2', ['b', 'd'])],
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
    const layout = layoutPatternConnectors(
      [pattern('i1', ['a', 'c'])],
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
    const patterns = [pattern('i1', ['a', 'b']), pattern('i2', ['c', 'd'])];

    // 既定の幅（96）なら離れているので同じ段に並ぶ。
    expect(
      layoutPatternConnectors(patterns, tokens, chips, WIDTH).segments.map((s) => s.y),
    ).toEqual([42, 42]);

    const wide = layoutPatternConnectors(
      patterns,
      tokens,
      chips,
      WIDTH,
      new Map([['i1', { width: 200, height: 16 }]]),
    );
    expect(wide.segments.map((s) => s.y)).toEqual([42, 66]);
    // 幅 200 のラベルが左端からはみ出さないよう、中心を 100 に寄せる。
    expect(wide.labels[0].x).toBe(100);
  });

  it('位置が分からないトークンは無視し、パターンが無ければ何も描かない', () => {
    expect(
      layoutPatternConnectors([pattern('i1', ['x', 'y'])], tokens, boxes(['a', 0, 0]), WIDTH),
    ).toEqual({ segments: [], ticks: [], labels: [], laneCount: 0, space: 0 });
  });
});
