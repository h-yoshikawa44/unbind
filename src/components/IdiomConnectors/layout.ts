/**
 * 慣用句の連結線（トークンチップの下に引くブラケット状の線）の配置計算。
 *
 * DOM に依存しない純粋関数にしておき、計測（useIdiomConnectors）と描画（IdiomConnectors）から分離する。
 */
import type { Idiom, Token } from '@/types';

/** 連結線を描く領域を基準にしたチップの位置・大きさ（px）。 */
export interface ChipBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** 慣用句の線（1 行ぶん）。行をまたぐ慣用句は行ごとに分かれ、続きがある側を open にする。 */
export interface ConnectorSegment {
  key: string;
  idiomId: string;
  x1: number;
  x2: number;
  y: number;
  openStart: boolean;
  openEnd: boolean;
}

/** チップの下端から線までの縦線。 */
export interface ConnectorTick {
  key: string;
  idiomId: string;
  x: number;
  y1: number;
  y2: number;
}

/** ラベルの大きさ（px）。 */
export interface LabelSize {
  width: number;
  height: number;
}

/** 線の上に載せる意味のラベル。 */
export interface ConnectorLabel {
  idiomId: string;
  number: number;
  meaning: string;
  x: number;
  y: number;
}

export interface ConnectorLayout {
  segments: ConnectorSegment[];
  ticks: ConnectorTick[];
  labels: ConnectorLabel[];
  /** 1 行に重ねて引く線の段数の最大値。 */
  laneCount: number;
  /** 線を描くために各行の下に確保する高さ（行間・下余白に使う）。線が無ければ 0。 */
  space: number;
}

/** チップ下端から 1 段目の線までの最小距離。 */
const LANE_OFFSET = 12;
/** 線を重ねるときの 1 段あたりの最小の高さ。 */
const LANE_HEIGHT = 24;
/** 段の間でラベルどうしを離す余白。 */
const LANE_PADDING = 6;
/** 同じ段に並べる線どうしの最小間隔。 */
const LANE_GAP = 16;
/** 計測前（jsdom など計測できない環境も含む）に仮定するラベルの大きさ。1 行ぶん。 */
const DEFAULT_LABEL_SIZE: LabelSize = { width: 96, height: 16 };

export const EMPTY_LAYOUT: ConnectorLayout = {
  segments: [],
  ticks: [],
  labels: [],
  laneCount: 0,
  space: 0,
};

/** 行ごとの線を引くための中間データ。 */
interface RowPart {
  idiom: Idiom;
  number: number;
  row: number;
  centers: { tokenId: string; x: number; bottom: number }[];
  x1: number;
  x2: number;
  openStart: boolean;
  openEnd: boolean;
  /** ラベルを載せる部分か（慣用句の最初の行）。 */
  hasLabel: boolean;
  lane: number;
}

/**
 * labelSizes は描画済みラベルの実寸（慣用句 ID ごと）。意味が 2 行に折り返したラベルの高さ・幅に合わせて
 * 段の間隔と重なり判定を行う。未計測のラベルは DEFAULT_LABEL_SIZE とみなす。
 */
export function layoutIdiomConnectors(
  idioms: readonly Idiom[],
  tokens: readonly Token[],
  boxes: ReadonlyMap<string, ChipBox>,
  width: number,
  labelSizes: ReadonlyMap<string, LabelSize> = new Map(),
): ConnectorLayout {
  const labelSize = (idiomId: string) => labelSizes.get(idiomId) ?? DEFAULT_LABEL_SIZE;
  /** ラベルの中心を置ける範囲に寄せる（領域の端からはみ出さないように）。 */
  const clampLabelX = (x: number, idiomId: string) => {
    const half = labelSize(idiomId).width / 2;
    return Math.min(Math.max(x, half), Math.max(width - half, half));
  };

  // 折り返し位置で行を判定する（前のチップより左に戻ったら次の行）。チップの高さが行内で揃わなくても判定できる。
  const rowOf = new Map<string, number>();
  const rowBottoms: number[] = [];
  let prevLeft = Number.NEGATIVE_INFINITY;
  for (const token of tokens) {
    const box = boxes.get(token.id);
    if (!box) continue;
    if (box.left < prevLeft || rowBottoms.length === 0) rowBottoms.push(0);
    const row = rowBottoms.length - 1;
    rowOf.set(token.id, row);
    rowBottoms[row] = Math.max(rowBottoms[row], box.top + box.height);
    prevLeft = box.left;
  }

  // 慣用句を行ごとの部分に分ける。
  const parts: RowPart[] = [];
  idioms.forEach((idiom, i) => {
    const byRow = new Map<number, RowPart['centers']>();
    for (const tokenId of idiom.tokenIds) {
      const box = boxes.get(tokenId);
      const row = rowOf.get(tokenId);
      if (!box || row === undefined) continue;
      const centers = byRow.get(row) ?? [];
      centers.push({ tokenId, x: box.left + box.width / 2, bottom: box.top + box.height });
      byRow.set(row, centers);
    }
    const rows = [...byRow.keys()].sort((a, b) => a - b);
    for (const row of rows) {
      const centers = (byRow.get(row) ?? []).sort((a, b) => a.x - b.x);
      const openStart = row !== rows[0];
      const openEnd = row !== rows[rows.length - 1];
      parts.push({
        idiom,
        number: i + 1,
        row,
        centers,
        x1: openStart ? 0 : centers[0].x,
        x2: openEnd ? width : centers[centers.length - 1].x,
        openStart,
        openEnd,
        hasLabel: row === rows[0],
        lane: 0,
      });
    }
  });

  // 行ごとに、短い線から順に重ならない最小の段へ割り当てる。
  // 入れ子（not only … but also の内側に turned … off など）では内側が上の段になり、縦線と横線が交差しない。
  let laneCount = 0;
  const rows = new Set(parts.map((p) => p.row));
  for (const row of rows) {
    const lanes: [number, number][][] = [];
    const inRow = parts
      .filter((p) => p.row === row)
      .sort((a, b) => a.x2 - a.x1 - (b.x2 - b.x1) || a.x1 - b.x1);
    for (const part of inRow) {
      let start = part.x1;
      let end = part.x2;
      // ラベルを中央に置くため、短い線でもラベル幅ぶんは占有しているとみなす。
      if (part.hasLabel) {
        const half = labelSize(part.idiom.id).width / 2;
        const x = clampLabelX((part.x1 + part.x2) / 2, part.idiom.id);
        start = Math.min(start, x - half);
        end = Math.max(end, x + half);
      }
      let lane = lanes.findIndex((used) =>
        used.every(([s, e]) => end + LANE_GAP <= s || e + LANE_GAP <= start),
      );
      if (lane === -1) lane = lanes.push([]) - 1;
      lanes[lane].push([start, end]);
      part.lane = lane;
    }
    laneCount = Math.max(laneCount, lanes.length);
  }

  // 段の間隔は一番高いラベルに合わせる（2 行のラベルがあれば全体の段を広げる）。
  // ラベルは線の上に縦中央で載るので、1 段目はラベルの上半分がチップに掛からない位置まで下げる。
  const labelHeight = Math.max(
    DEFAULT_LABEL_SIZE.height,
    ...parts.filter((p) => p.hasLabel).map((p) => labelSize(p.idiom.id).height),
  );
  const laneOffset = Math.max(LANE_OFFSET, labelHeight / 2 + 4);
  const laneHeight = Math.max(LANE_HEIGHT, labelHeight + LANE_PADDING);
  const space =
    laneCount > 0
      ? laneOffset + (laneCount - 1) * laneHeight + Math.max(labelHeight / 2 + 8, LANE_HEIGHT)
      : 0;

  const layout: ConnectorLayout = { segments: [], ticks: [], labels: [], laneCount, space };
  for (const part of parts) {
    const y = rowBottoms[part.row] + laneOffset + part.lane * laneHeight;
    const key = `${part.idiom.id}-${part.row}`;
    layout.segments.push({
      key,
      idiomId: part.idiom.id,
      x1: part.x1,
      x2: part.x2,
      y,
      openStart: part.openStart,
      openEnd: part.openEnd,
    });
    for (const c of part.centers) {
      layout.ticks.push({
        key: `${part.idiom.id}-${c.tokenId}`,
        idiomId: part.idiom.id,
        x: c.x,
        y1: c.bottom,
        y2: y,
      });
    }
    // ラベルは慣用句の最初の行に 1 つだけ置く。
    if (part.hasLabel) {
      layout.labels.push({
        idiomId: part.idiom.id,
        number: part.number,
        meaning: part.idiom.meaning,
        x: clampLabelX((part.x1 + part.x2) / 2, part.idiom.id),
        y,
      });
    }
  }
  return layout;
}
