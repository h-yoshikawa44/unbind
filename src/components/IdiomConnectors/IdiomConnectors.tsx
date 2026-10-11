import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Idiom, Token } from '@/types';
import type { ChipBox, ConnectorLayout, LabelSize } from '@/components/IdiomConnectors/layout';
import { EMPTY_LAYOUT, layoutIdiomConnectors } from '@/components/IdiomConnectors/layout';
import { idiomText } from '@/idioms';
import styles from '@/components/IdiomConnectors/IdiomConnectors.module.css';

/**
 * トークンチップの位置を計測して、慣用句の連結線の配置を求める。
 *
 * - containerRef: チップと連結線を包む要素（position: relative。チップの offset はここを基準に測る）
 * - chipRef(id): 各チップに渡す ref コールバック
 * - listStyle: 連結線を描く余白（行間・下余白）を確保するためにトークン一覧へ当てるスタイル
 */
export function useIdiomConnectors(idioms: readonly Idiom[], tokens: readonly Token[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chips = useRef(new Map<string, HTMLElement>());
  const [layout, setLayout] = useState<ConnectorLayout>(EMPTY_LAYOUT);

  const chipRef = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) chips.current.set(id, el);
      else chips.current.delete(id);
    },
    [],
  );

  // チップとラベルの位置・大きさを測って配置を求める。配置が変わったときだけ更新する（行間の変更 → 再計測でループしないように）。
  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const boxes = new Map<string, ChipBox>();
    for (const [id, el] of chips.current) {
      boxes.set(id, {
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
      });
    }
    // ラベルは意味の長さで幅が変わり、2 行に折り返すと高さも変わる。描画済みの実寸を段組みに使う。
    const labelSizes = new Map<string, LabelSize>();
    for (const el of container.querySelectorAll<HTMLElement>('[data-idiom-label]')) {
      const idiomId = el.dataset.idiomLabel;
      if (idiomId) labelSizes.set(idiomId, { width: el.offsetWidth, height: el.offsetHeight });
    }
    const next = layoutIdiomConnectors(idioms, tokens, boxes, container.clientWidth, labelSizes);
    setLayout((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [idioms, tokens]);

  // 配置が変わると新しいラベルが描画されるので、その実寸で測り直す（大きさが変わらなければ配置も変わらず止まる）。
  useLayoutEffect(() => {
    measure();
  }, [measure, layout]);

  // 領域の幅（折り返し位置）やチップの大きさ（バッジの増減・選択モード）が変わったら測り直す。
  // jsdom など ResizeObserver が無い環境では何もしない。
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => measure());
    observer.observe(container);
    for (const el of chips.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  // 線とラベルのぶん行間を広げる（最終行の下にも同じだけ余白を取る）。
  const listStyle: CSSProperties | undefined =
    layout.space > 0
      ? { rowGap: `${layout.space + 8}px`, paddingBottom: `${layout.space}px` }
      : undefined;

  return { containerRef, chipRef, layout, listStyle };
}

interface Props {
  layout: ConnectorLayout;
  idioms: readonly Idiom[];
  tokens: readonly Token[];
  /** 編集中（パネルを開いている）慣用句の ID。線とラベルを強調する。 */
  activeIdiomId: string | null;
  /** ラベルのクリック。未指定（選択モード中など）ならラベルを押せなくする。 */
  onLabelClick?: (idiomId: string) => void;
}

/**
 * 慣用句の連結線と意味のラベル。
 * 線は装飾なので支援技術から隠し、ラベルは慣用句を編集するボタンとして公開する。
 */
export function IdiomConnectors({ layout, idioms, tokens, activeIdiomId, onLabelClick }: Props) {
  const lineClass = (base: string, idiomId: string) =>
    idiomId === activeIdiomId ? `${base} ${styles.lineActive}` : base;

  return (
    <div className={styles.connectors}>
      <div aria-hidden="true">
        {layout.ticks.map((t) => (
          <span
            key={t.key}
            className={lineClass(styles.tick, t.idiomId)}
            style={{ left: t.x, top: t.y1, height: Math.max(t.y2 - t.y1, 0) }}
          />
        ))}
        {layout.segments.map((s) => {
          const classes = [lineClass(styles.segment, s.idiomId)];
          if (s.openStart) classes.push(styles.segmentOpenStart);
          if (s.openEnd) classes.push(styles.segmentOpenEnd);
          return (
            <span
              key={s.key}
              className={classes.join(' ')}
              style={{ left: s.x1, top: s.y, width: Math.max(s.x2 - s.x1, 0) }}
            />
          );
        })}
      </div>
      {layout.labels.map((l) => {
        const idiom = idioms.find((i) => i.id === l.idiomId);
        const text = idiom ? idiomText(idiom, tokens) : '';
        const isActive = l.idiomId === activeIdiomId;
        return (
          <button
            key={l.idiomId}
            data-idiom-label={l.idiomId}
            type="button"
            className={isActive ? `${styles.label} ${styles.labelActive}` : styles.label}
            style={{ left: l.x, top: l.y }}
            onClick={() => onLabelClick?.(l.idiomId)}
            disabled={!onLabelClick}
            aria-label={`慣用句「${text}」を編集`}
            aria-pressed={isActive}
          >
            <span className={styles.labelNumber}>{l.number}</span>
            {l.meaning ? (
              <span className={styles.labelMeaning}>{l.meaning}</span>
            ) : (
              <span className={`${styles.labelMeaning} ${styles.labelMeaningEmpty}`}>
                意味未入力
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
