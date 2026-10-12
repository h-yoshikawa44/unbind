import { useEffect, useId, useRef } from 'react';
import { PART_OF_SPEECH_LABELS, PART_OF_SPEECH_VALUES } from '@/types';
import type { PartOfSpeech } from '@/types';
import { PART_OF_SPEECH_GUIDES, parseExample } from '@/components/PartOfSpeechGuide/guides';
import styles from '@/components/PartOfSpeechGuide/PartOfSpeechGuide.module.css';
import buttonStyles from '@/styles/button.module.css';

interface Props {
  open: boolean;
  /** Esc・閉じるボタン・背景クリックで閉じたときに呼ばれる。 */
  onClose: () => void;
}

/** 品詞ごとの働き・見分け方・例文を一覧できるモーダル。 */
export function PartOfSpeechGuide({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const idPrefix = useId();
  const titleId = `${idPrefix}-title`;
  const sectionId = (pos: PartOfSpeech) => `${idPrefix}-${pos}`;

  // open の変化をネイティブの <dialog> に反映する。
  // 閉じる操作は dialog.close() に一本化し、close イベントで onClose を呼ぶ（Esc で閉じた場合も同じ経路）。
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => dialogRef.current?.close();

  const scrollTo = (pos: PartOfSpeech) => {
    document.getElementById(sectionId(pos))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        // 本体の外側（::backdrop）のクリックは dialog 自身がターゲットになる。
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className={styles.content}>
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            品詞ガイド
          </h2>
          <button
            type="button"
            className={`${buttonStyles.btn} ${buttonStyles.btnOutline} ${buttonStyles.btnSm}`}
            onClick={close}
          >
            閉じる
          </button>
        </header>

        <nav className={styles.nav} aria-label="品詞へ移動">
          {PART_OF_SPEECH_VALUES.map((pos) => (
            <button
              key={pos}
              type="button"
              className={styles.navItem}
              data-pos={pos}
              onClick={() => scrollTo(pos)}
            >
              {PART_OF_SPEECH_LABELS[pos]}
            </button>
          ))}
        </nav>

        <div className={styles.body}>
          {PART_OF_SPEECH_VALUES.map((pos) => {
            const guide = PART_OF_SPEECH_GUIDES[pos];
            return (
              <section
                key={pos}
                id={sectionId(pos)}
                className={styles.section}
                data-pos={pos}
                aria-labelledby={`${sectionId(pos)}-heading`}
              >
                <h3 id={`${sectionId(pos)}-heading`} className={styles.sectionTitle}>
                  {PART_OF_SPEECH_LABELS[pos]}
                </h3>
                <p className={styles.role}>{guide.role}</p>

                <h4 className={styles.subTitle}>見分け方</h4>
                <ul className={styles.hints}>
                  {guide.hints.map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>

                {guide.examples.length > 0 && (
                  <>
                    <h4 className={styles.subTitle}>例</h4>
                    <ul className={styles.examples}>
                      {guide.examples.map((example) => (
                        <li key={example}>
                          {parseExample(example).map((part, i) =>
                            part.highlight ? (
                              <mark key={i} className={styles.exampleHighlight}>
                                {part.text}
                              </mark>
                            ) : (
                              <span key={i}>{part.text}</span>
                            ),
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </dialog>
  );
}
