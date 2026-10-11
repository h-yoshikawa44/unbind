import { composeStories } from '@storybook/react-vite';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { analyzedSentence } from '@/fixtures/sentences';
import * as stories from '@/components/SentenceEditor/SentenceEditor.stories';

const { Analyzed, Unanalyzed } = composeStories(stories);

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
        analyzedSentence.naturalTranslation,
        analyzedSentence.tags,
      );
      // 保存後は未変更状態に戻る。
      expect(save).toBeDisabled();
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
        '辞書でその単語を引いた。',
        ['過去文', '辞書'],
      );
    });
  });

  describe('フレーズ操作', () => {
    it('隣接したトークンを選んでグループ化すると、1 つのフレーズトークンになる', async () => {
      const user = userEvent.setup();
      render(<Analyzed />);

      await user.click(screen.getByRole('button', { name: 'フレーズを作成' }));
      expect(screen.getByText('グループ化したいトークンを選択してください')).toBeInTheDocument();
      // 選択中はバッジを出さない。
      expect(chip('I')).not.toHaveTextContent('代名詞');

      await user.click(chip('in'));
      await user.click(chip('a'));
      await user.click(screen.getByRole('button', { name: 'グループ化' }));

      expect(chipTexts()).toEqual(['I', 'looked up', 'the', 'word', 'in a', 'dictionary.']);
      expect(screen.getByRole('button', { name: 'フレーズを作成' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '保存' })).toBeEnabled();
    });

    it('隣接していないトークンを選ぶと警告を出し、グループ化させない', async () => {
      const user = userEvent.setup();
      render(<Analyzed />);

      await user.click(screen.getByRole('button', { name: 'フレーズを作成' }));
      await user.click(chip('I'));
      await user.click(chip('the'));

      expect(screen.getByText('隣接したトークンのみグループ化できます')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'グループ化' })).not.toBeInTheDocument();
    });

    it('同じトークンをもう一度クリックすると選択を解除する', async () => {
      const user = userEvent.setup();
      render(<Analyzed />);

      await user.click(screen.getByRole('button', { name: 'フレーズを作成' }));
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
});
