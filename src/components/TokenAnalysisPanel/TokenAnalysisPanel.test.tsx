import { composeStories } from '@storybook/react-vite';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import * as stories from '@/components/TokenAnalysisPanel/TokenAnalysisPanel.stories';

const { Noun, VerbPhrase, BeVerb, ToInfinitive, Unanalyzed } = composeStories(stories);

describe('TokenAnalysisPanel', () => {
  describe('単語トークン（名詞）', () => {
    it('トークンの種別・テキスト・分析内容を表示する', () => {
      render(<Noun />);
      // 意味欄の値も「単語」なので、種別ラベル（span）に絞って探す。
      expect(screen.getByText('単語', { selector: 'span' })).toBeInTheDocument();
      expect(screen.getByText('word')).toBeInTheDocument();
      expect(screen.getByDisplayValue('名詞')).toBeInTheDocument();
      expect(screen.getByDisplayValue('単数形')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveValue('単語');
    });

    it('名詞のときは数の選択欄だけを出し、変化形・分解ボタンは出さない', () => {
      render(<Noun />);
      expect(screen.getByText('数')).toBeInTheDocument();
      expect(screen.queryByText('変化形')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '分解する' })).not.toBeInTheDocument();
    });

    it('品詞を変えると、その項目だけ更新したトークンが onChange に渡る', async () => {
      const user = userEvent.setup();
      render(<Noun />);

      await user.selectOptions(screen.getByDisplayValue('名詞'), '形容詞');

      expect(Noun.args.onChange).toHaveBeenCalledWith({
        ...Noun.args.token,
        partOfSpeech: 'adjective',
      });
    });

    it('数を変えると nounForm を更新したトークンが onChange に渡る', async () => {
      const user = userEvent.setup();
      render(<Noun />);

      await user.selectOptions(screen.getByDisplayValue('単数形'), '複数形');

      expect(Noun.args.onChange).toHaveBeenCalledWith({ ...Noun.args.token, nounForm: 'plural' });
    });

    it('意味を入力すると wordMeaning を更新したトークンが onChange に渡る', async () => {
      const user = userEvent.setup();
      render(<Noun />);

      await user.type(screen.getByRole('textbox'), '!');

      expect(Noun.args.onChange).toHaveBeenCalledWith({ ...Noun.args.token, wordMeaning: '単語!' });
    });
  });

  describe('フレーズトークン（動詞）', () => {
    it('フレーズとして表示し、変化形と慣用句の意味を出す', () => {
      render(<VerbPhrase />);
      expect(screen.getByText('フレーズ')).toBeInTheDocument();
      expect(screen.getByText('looked up')).toBeInTheDocument();
      expect(screen.getByDisplayValue('過去形')).toBeInTheDocument();
      expect(screen.getByText('慣用句としての意味')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveValue('調べた');
    });

    it('慣用句の意味を入力すると idiomMeaning を更新したトークンが onChange に渡る', async () => {
      const user = userEvent.setup();
      render(<VerbPhrase />);

      await user.type(screen.getByRole('textbox'), '!');

      expect(VerbPhrase.args.onChange).toHaveBeenCalledWith({
        ...VerbPhrase.args.token,
        idiomMeaning: '調べた!',
      });
    });

    it('分解ボタンで onSplit を呼ぶ', async () => {
      const user = userEvent.setup();
      render(<VerbPhrase />);

      await user.click(screen.getByRole('button', { name: '分解する' }));

      expect(VerbPhrase.args.onSplit).toHaveBeenCalledTimes(1);
    });

    it('onSplit を渡さなければ分解ボタンは出さない', () => {
      render(<VerbPhrase onSplit={undefined} />);
      expect(screen.queryByRole('button', { name: '分解する' })).not.toBeInTheDocument();
    });
  });

  describe('単語トークン（be動詞）', () => {
    it('be動詞のときは変化形の選択欄を出す', () => {
      render(<BeVerb />);
      expect(screen.getByText('変化形')).toBeInTheDocument();
      expect(screen.getByDisplayValue('過去形')).toBeInTheDocument();
    });

    it('変化形を変えると verbForm を更新したトークンが onChange に渡る', async () => {
      const user = userEvent.setup();
      render(<BeVerb />);

      await user.selectOptions(screen.getByDisplayValue('過去形'), '過去分詞');

      expect(BeVerb.args.onChange).toHaveBeenCalledWith({
        ...BeVerb.args.token,
        verbForm: 'past-participle',
      });
    });
  });

  describe('単語トークン（to不定詞）', () => {
    it('to不定詞のときは変化形として用法の選択欄を出し、数の選択欄は出さない', () => {
      render(<ToInfinitive />);
      expect(screen.getByText('変化形')).toBeInTheDocument();
      expect(screen.getByDisplayValue('副詞的用法')).toBeInTheDocument();
      expect(screen.queryByText('数')).not.toBeInTheDocument();
    });

    it('用法を変えると infinitiveUsage を更新したトークンが onChange に渡る', async () => {
      const user = userEvent.setup();
      render(<ToInfinitive />);

      await user.selectOptions(screen.getByDisplayValue('副詞的用法'), '名詞的用法');

      expect(ToInfinitive.args.onChange).toHaveBeenCalledWith({
        ...ToInfinitive.args.token,
        infinitiveUsage: 'noun',
      });
    });
  });

  it('品詞が未選択なら品詞の選択欄だけを出す', () => {
    render(<Unanalyzed />);
    expect(screen.getAllByRole('combobox')).toHaveLength(1);
    expect(screen.getByRole('combobox')).toHaveValue('');
  });
});
