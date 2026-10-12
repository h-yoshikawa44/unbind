import { composeStories } from '@storybook/react-vite';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { analyzedSentence, patternSentence } from '@/fixtures/sentences';
import * as stories from '@/components/SentenceEditor/SentenceEditor.stories';

const { Analyzed, Unanalyzed, WithPattern } = composeStories(stories);

/**
 * トークンチップ（role="listitem" の button）を表示順に取り出す。
 * TagInput のタグチップ（<li>）も listitem になるため、button だけに絞る。
 */
function chips(): HTMLElement[] {
  return screen.getAllByRole('listitem').filter((el) => el.tagName === 'BUTTON');
}

/** 指定テキストのトークンチップを取り出す。 */
function chip(text: string): HTMLElement {
  const found = chips().find((el) => el.firstElementChild?.textContent === text);
  if (!found) throw new Error(`トークンチップが見つかりません: ${text}`);
  return found;
}

/** トークンチップのテキスト一覧（表示順）。 */
function chipTexts(): string[] {
  return chips().map((el) => el.firstElementChild?.textContent ?? '');
}

describe('SentenceEditor', () => {
  describe('初期表示', () => {
    it('英文・トークン・意訳・タグを props から表示する', () => {
      render(<Analyzed />);
      expect(screen.getByText(analyzedSentence.text)).toBeInTheDocument();
      expect(chipTexts()).toEqual(analyzedSentence.tokens.map((t) => t.text));
      expect(screen.getByLabelText('意訳')).toHaveValue(analyzedSentence.naturalTranslation);
      for (const tag of analyzedSentence.tags) {
        expect(screen.getByRole('button', { name: `タグ「${tag}」を削除` })).toBeInTheDocument();
      }
    });

    it('トークンの分析内容をバッジとして表示する', () => {
      render(<Analyzed />);
      expect(chip('I')).toHaveTextContent('代名詞');
      expect(chip('looked up')).toHaveTextContent('動詞');
      expect(chip('looked up')).toHaveTextContent('過去形');
      expect(chip('looked up')).toHaveTextContent('慣: 調べた');
      expect(chip('word')).toHaveTextContent('単数形');
      expect(chip('word')).toHaveTextContent('単語');
    });

    it('未分析のトークンは品詞を「—」で表示する', () => {
      render(<Unanalyzed />);
      expect(chip('Nice')).toHaveTextContent('—');
    });

    it('変更が無いうちは保存ボタンを無効にする', () => {
      render(<Analyzed />);
      expect(screen.getByRole('button', { name: '保存' })).toBeDisabled();
      expect(screen.getByText('トークンをクリックして分析情報を入力できます')).toBeInTheDocument();
    });
  });

  describe('トークンの分析', () => {
    it('トークンをクリックすると分析パネルを開き、もう一度クリックすると閉じる', async () => {
      const user = userEvent.setup();
      render(<Analyzed />);

      await user.click(chip('word'));
      expect(screen.getByText('数')).toBeInTheDocument();
      expect(screen.getByDisplayValue('名詞')).toBeInTheDocument();

      await user.click(chip('word'));
      expect(screen.queryByText('数')).not.toBeInTheDocument();
      expect(screen.getByText('トークンをクリックして分析情報を入力できます')).toBeInTheDocument();
    });

    it('パネルで品詞を変えるとチップに反映し、保存すると変更後のトークンを onSave に渡す', async () => {
      const user = userEvent.setup();
      render(<Analyzed />);

      await user.click(chip('word'));
      await user.selectOptions(screen.getByDisplayValue('名詞'), '形容詞');

      expect(chip('word')).toHaveTextContent('形容詞');

      const save = screen.getByRole('button', { name: '保存' });
      expect(save).toBeEnabled();
      await user.click(save);

      expect(Analyzed.args.onSave).toHaveBeenCalledWith(
        analyzedSentence.tokens.map((t) =>
          t.id === 's1-t3' ? { ...t, partOfSpeech: 'adjective' } : t,
        ),
        [],
        analyzedSentence.naturalTranslation,
        analyzedSentence.tags,
      );
      // 保存後は未変更状態に戻る。
      expect(save).toBeDisabled();
    });

    it('変化形のバッジは動詞・be動詞・助動詞のときだけ出す', async () => {
      const user = userEvent.setup();
      render(<Analyzed />);
      await user.click(chip('looked up'));

      await user.selectOptions(screen.getByDisplayValue('動詞'), 'be動詞');
      expect(chip('looked up')).toHaveTextContent('過去形');

      await user.selectOptions(screen.getByDisplayValue('be動詞'), '助動詞');
      expect(chip('looked up')).toHaveTextContent('過去形');

      await user.selectOptions(screen.getByDisplayValue('助動詞'), '名詞');
      expect(chip('looked up')).not.toHaveTextContent('過去形');
    });

    it('助動詞では選べない変化形は、助動詞に変えるとバッジに出さない', async () => {
      const user = userEvent.setup();
      render(<Analyzed />);
      await user.click(chip('looked up'));

      await user.selectOptions(screen.getByDisplayValue('過去形'), '過去分詞');
      await user.selectOptions(screen.getByDisplayValue('動詞'), '助動詞');

      expect(chip('looked up')).not.toHaveTextContent('過去分詞');
    });
  });

  describe('意訳・タグ', () => {
    it('意訳とタグの変更を保持し、保存時に onSave に渡す', async () => {
      const user = userEvent.setup();
      render(<Analyzed />);

      const translation = screen.getByLabelText('意訳');
      await user.clear(translation);
      await user.type(translation, '辞書でその単語を引いた。');
      await user.type(screen.getByRole('combobox'), '辞書{Enter}');
      await user.click(screen.getByRole('button', { name: 'タグ「句動詞」を削除' }));
      await user.click(screen.getByRole('button', { name: '保存' }));

      expect(Analyzed.args.onSave).toHaveBeenCalledWith(
        analyzedSentence.tokens,
        [],
        '辞書でその単語を引いた。',
        ['過去文', '辞書'],
      );
    });
  });

  describe('フレーズ操作', () => {
    it('隣接したトークンを選んでグループ化すると、1 つのフレーズトークンになる', async () => {
      const user = userEvent.setup();
      render(<Analyzed />);

      await user.click(screen.getByRole('button', { name: '隣接フレーズを作成' }));
      expect(screen.getByText('グループ化したいトークンを選択してください')).toBeInTheDocument();
      // 選択中はバッジを出さない。
      expect(chip('I')).not.toHaveTextContent('代名詞');

      await user.click(chip('in'));
      await user.click(chip('a'));
      await user.click(screen.getByRole('button', { name: 'グループ化' }));

      expect(chipTexts()).toEqual(['I', 'looked up', 'the', 'word', 'in a', 'dictionary.']);
      expect(screen.getByRole('button', { name: '隣接フレーズを作成' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '保存' })).toBeEnabled();
    });

    it('隣接していないトークンを選ぶと警告を出し、グループ化させない', async () => {
      const user = userEvent.setup();
      render(<Analyzed />);

      await user.click(screen.getByRole('button', { name: '隣接フレーズを作成' }));
      await user.click(chip('I'));
      await user.click(chip('the'));

      expect(screen.getByText('隣接したトークンのみグループ化できます')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'グループ化' })).not.toBeInTheDocument();
    });

    it('同じトークンをもう一度クリックすると選択を解除する', async () => {
      const user = userEvent.setup();
      render(<Analyzed />);

      await user.click(screen.getByRole('button', { name: '隣接フレーズを作成' }));
      await user.click(chip('in'));
      await user.click(chip('a'));
      await user.click(chip('a'));

      expect(screen.queryByRole('button', { name: 'グループ化' })).not.toBeInTheDocument();
    });

    it('フレーズトークンを分解すると元の単語に戻る', async () => {
      const user = userEvent.setup();
      render(<Analyzed />);

      await user.click(chip('looked up'));
      await user.click(screen.getByRole('button', { name: '分解する' }));

      expect(chipTexts()).toEqual(['I', 'looked', 'up', 'the', 'word', 'in', 'a', 'dictionary.']);
      expect(screen.getByRole('button', { name: '保存' })).toBeEnabled();
    });
  });

  describe('パターン', () => {
    /** 連結線上のパターンラベル（クリックでパネルを開閉するボタン）。 */
    function patternLabel(text: string): HTMLElement {
      return screen.getByRole('button', { name: `パターン「${text}」を編集` });
    }

    // 連結線の位置は jsdom では計測できないため layout.test.ts で検証し、ここではラベルとパネルの振る舞いを確かめる。
    it('連結線上にパターンの意味のラベルを出し、意味の入力欄は最初は表示しない', () => {
      render(<WithPattern />);
      expect(patternLabel('turn … off.')).toHaveTextContent(patternSentence.patterns[0].meaning);
      expect(screen.queryByLabelText('パターンの意味')).not.toBeInTheDocument();
      // パターンを構成していても、単語ごとの品詞・意味はそのまま表示する。
      expect(chip('turn')).toHaveTextContent('動詞');
      expect(chip('turn')).toHaveTextContent('回す');
    });

    it('ラベルをクリックすると意味の入力パネルを開き、もう一度クリックすると閉じる', async () => {
      const user = userEvent.setup();
      render(<WithPattern />);

      await user.click(patternLabel('turn … off.'));
      expect(patternLabel('turn … off.')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByLabelText('パターンの意味')).toHaveValue(
        patternSentence.patterns[0].meaning,
      );

      await user.click(patternLabel('turn … off.'));
      expect(patternLabel('turn … off.')).toHaveAttribute('aria-pressed', 'false');
      expect(screen.queryByLabelText('パターンの意味')).not.toBeInTheDocument();
    });

    it('パターンのパネルとトークンの分析パネルは同時に開かない', async () => {
      const user = userEvent.setup();
      render(<WithPattern />);

      await user.click(patternLabel('turn … off.'));
      await user.click(chip('light'));
      expect(screen.queryByLabelText('パターンの意味')).not.toBeInTheDocument();
      expect(screen.getByDisplayValue('名詞')).toBeInTheDocument();

      await user.click(patternLabel('turn … off.'));
      expect(screen.getByLabelText('パターンの意味')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('名詞')).not.toBeInTheDocument();
    });

    it('パネルで意味を変えるとラベルに反映し、保存すると変更後のパターンを onSave に渡す', async () => {
      const user = userEvent.setup();
      render(<WithPattern />);

      await user.click(patternLabel('turn … off.'));
      const meaning = screen.getByLabelText('パターンの意味');
      await user.clear(meaning);
      await user.type(meaning, '消す');

      expect(patternLabel('turn … off.')).toHaveTextContent('消す');
      await user.click(screen.getByRole('button', { name: '保存' }));
      expect(WithPattern.args.onSave).toHaveBeenCalledWith(
        patternSentence.tokens,
        [{ ...patternSentence.patterns[0], meaning: '消す' }],
        patternSentence.naturalTranslation,
        patternSentence.tags,
      );
    });

    it('隣接していないトークンを選んで登録すると、パターンを追加してそのパネルを開く', async () => {
      const user = userEvent.setup();
      render(<Analyzed />);

      await user.click(screen.getByRole('button', { name: 'パターンを作成' }));
      expect(
        screen.getByText(
          'パターンを構成するトークンを2つ以上選択してください（離れていても選べます）',
        ),
      ).toBeInTheDocument();
      // 選択中はフレーズの作成ボタンを出さない。
      expect(screen.queryByRole('button', { name: '隣接フレーズを作成' })).not.toBeInTheDocument();

      await user.click(chip('looked up'));
      await user.click(chip('word'));
      await user.click(screen.getByRole('button', { name: 'パターンに登録' }));

      // 意味が未入力のうちは、ラベルにその旨を出す。
      expect(patternLabel('looked up … word')).toHaveTextContent('意味未入力');
      expect(screen.getByLabelText('パターンの意味')).toHaveFocus();
      // トークンは結合しない。
      expect(chipTexts()).toEqual(analyzedSentence.tokens.map((t) => t.text));
      expect(screen.getByRole('button', { name: 'パターンを作成' })).toBeInTheDocument();
    });

    it('トークンを 1 つしか選んでいないうちは登録ボタンを出さない', async () => {
      const user = userEvent.setup();
      render(<Analyzed />);

      await user.click(screen.getByRole('button', { name: 'パターンを作成' }));
      await user.click(chip('word'));

      expect(screen.queryByRole('button', { name: 'パターンに登録' })).not.toBeInTheDocument();
    });

    it('選択モード中はパターンのラベルを押せない', async () => {
      const user = userEvent.setup();
      render(<WithPattern />);

      await user.click(screen.getByRole('button', { name: 'パターンを作成' }));

      expect(patternLabel('turn … off.')).toBeDisabled();
    });

    it('パターンを登録して意味を入力すると、トークン順の tokenIds と意味を onSave に渡す', async () => {
      const user = userEvent.setup();
      render(<Analyzed />);

      await user.click(screen.getByRole('button', { name: 'パターンを作成' }));
      // 後ろのトークンから選んでも、英文中の順に並べて保存する。
      await user.click(chip('word'));
      await user.click(chip('I'));
      await user.click(screen.getByRole('button', { name: 'パターンに登録' }));
      await user.type(screen.getByLabelText('パターンの意味'), 'テスト');
      await user.click(screen.getByRole('button', { name: '保存' }));

      expect(Analyzed.args.onSave).toHaveBeenCalledWith(
        analyzedSentence.tokens,
        [{ id: expect.any(String), tokenIds: ['s1-t0', 's1-t3'], meaning: 'テスト' }],
        analyzedSentence.naturalTranslation,
        analyzedSentence.tags,
      );
    });

    it('パネルでパターンを削除するとラベルとパネルが消え、保存時に渡す一覧からも除かれる', async () => {
      const user = userEvent.setup();
      render(<WithPattern />);

      await user.click(patternLabel('turn … off.'));
      await user.click(screen.getByRole('button', { name: 'パターン「turn … off.」を削除' }));

      expect(
        screen.queryByRole('button', { name: 'パターン「turn … off.」を編集' }),
      ).not.toBeInTheDocument();
      expect(screen.queryByLabelText('パターンの意味')).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: '保存' }));
      expect(WithPattern.args.onSave).toHaveBeenCalledWith(
        patternSentence.tokens,
        [],
        patternSentence.naturalTranslation,
        patternSentence.tags,
      );
    });

    it('パターンの単語をフレーズに結合すると、パターンはフレーズトークンを参照する', async () => {
      const user = userEvent.setup();
      render(<WithPattern />);

      await user.click(screen.getByRole('button', { name: '隣接フレーズを作成' }));
      await user.click(chip('light'));
      await user.click(chip('off.'));
      await user.click(screen.getByRole('button', { name: 'グループ化' }));

      expect(patternLabel('turn … light off.')).toHaveTextContent(
        patternSentence.patterns[0].meaning,
      );
    });

    it('パターンに含まれるフレーズを分解すると、分解後の単語すべてを参照する', async () => {
      const user = userEvent.setup();
      render(<Analyzed />);

      await user.click(screen.getByRole('button', { name: 'パターンを作成' }));
      await user.click(chip('looked up'));
      await user.click(chip('word'));
      await user.click(screen.getByRole('button', { name: 'パターンに登録' }));
      await user.click(chip('looked up'));
      await user.click(screen.getByRole('button', { name: '分解する' }));

      expect(patternLabel('looked up … word')).toBeInTheDocument();
    });
  });

  describe('戻る', () => {
    it('未変更なら確認せずに onBack を呼ぶ', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm');
      render(<Analyzed />);

      await user.click(screen.getByRole('button', { name: '← 戻る' }));

      expect(confirmSpy).not.toHaveBeenCalled();
      expect(Analyzed.args.onBack).toHaveBeenCalledTimes(1);
    });

    it('未保存の変更があるとき、確認でキャンセルすると onBack を呼ばない', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      render(<Analyzed />);

      await user.type(screen.getByLabelText('意訳'), '!');
      await user.click(screen.getByRole('button', { name: '← 戻る' }));

      expect(Analyzed.args.onBack).not.toHaveBeenCalled();
    });

    it('未保存の変更があるとき、確認で OK すると onBack を呼ぶ', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      render(<Analyzed />);

      await user.type(screen.getByLabelText('意訳'), '!');
      await user.click(screen.getByRole('button', { name: '← 戻る' }));

      expect(confirmSpy).toHaveBeenCalledWith('保存していない変更があります。戻りますか？');
      expect(Analyzed.args.onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('品詞ガイド', () => {
    it('品詞ガイドボタンでモーダルを開き、閉じるボタンで閉じる', async () => {
      const user = userEvent.setup();
      render(<Analyzed />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '品詞ガイド' }));
      expect(screen.getByRole('dialog', { name: '品詞ガイド' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '閉じる' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('閉じた後にもう一度開ける', async () => {
      const user = userEvent.setup();
      render(<Analyzed />);
      await user.click(screen.getByRole('button', { name: '品詞ガイド' }));
      await user.click(screen.getByRole('button', { name: '閉じる' }));

      await user.click(screen.getByRole('button', { name: '品詞ガイド' }));
      expect(screen.getByRole('dialog', { name: '品詞ガイド' })).toBeInTheDocument();
    });
  });
});
