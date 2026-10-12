import type { PartOfSpeech } from '@/types';

export interface PartOfSpeechGuideEntry {
  /** 文の中での働き（1〜2文）。 */
  role: string;
  /** 見分け方・迷いやすい点。 */
  hints: string[];
  /** 例文。`[...]` で囲んだ部分が該当する語として強調される。 */
  examples: string[];
}

/**
 * 品詞ガイドの内容。Record にしているので、品詞を追加したらここにも追加しないと型エラーになる。
 * 表示順は PART_OF_SPEECH_VALUES に従う。
 */
export const PART_OF_SPEECH_GUIDES: Record<PartOfSpeech, PartOfSpeechGuideEntry> = {
  noun: {
    role: '人・物・事柄・概念などの名前を表す。文の主語・目的語・補語になる。',
    hints: [
      'a / an / the や my / this などの直後に来ることが多い',
      '数えられる名詞は複数形で -s / -es が付く（数は「単数形 / 複数形」で選べる）',
      '-tion / -ment / -ness / -ity で終わる語は名詞であることが多い',
      '前置詞の直後に来る（in the room の room）',
    ],
    examples: ['The [cat] is sleeping.', 'I need some [water].'],
  },
  pronoun: {
    role: '名詞の繰り返しを避けて、その代わりに使う語。',
    hints: [
      'I / you / he / she / it / we / they と、その変化形（me / him / my / mine / myself など）',
      '主格・目的格・所有格で形が変わる（I → me → my）',
      'this / that / these / those が単独で使われるとき（後ろに名詞が無い）',
      'something / everyone / nothing などの「不特定の人・物」を表す語',
    ],
    examples: ['[She] gave [me] a book.', '[This] is my bag.'],
  },
  'interrogative-pronoun': {
    role: '「誰」「何」「どれ」を尋ねる疑問詞のうち、文の中で名詞の働き（主語・目的語）をするもの。',
    hints: [
      'who / whom / whose / what / which',
      '文頭に来て疑問文を作ることが多い',
      'when / where / why / how は名詞ではなく副詞の働きをする（疑問副詞）ので「副詞」を選ぶ',
    ],
    examples: ['[Who] is that man?', '[What] do you want?'],
  },
  verb: {
    role: '主語の動作や状態を表す、文の中心となる語。',
    hints: [
      '主語の直後に来ることが多く、「〜する」と訳せる',
      '時制や主語によって形が変わる（play / plays / played / playing）。形は「変化形」で選べる',
      'can / will / must / should などの助動詞も「動詞」を選び、変化形で「助動詞」を指定する',
      'be 動詞（am / is / are など）は「be動詞」を選ぶ',
    ],
    examples: ['I [play] tennis every day.', 'She [studied] hard.'],
  },
  'be-verb': {
    role: '「〜である」「（〜に）いる・ある」を表す動詞。進行形や受動態を作るのにも使う。',
    hints: [
      'am / is / are / was / were / be / been / being',
      '主語 ＝ 後ろの語 の関係を作る（He is a teacher. → He ＝ a teacher）',
      'be ＋ -ing で進行形、be ＋ 過去分詞で受動態になる',
    ],
    examples: ['He [is] a teacher.', 'They [were] in the park.'],
  },
  adjective: {
    role: '名詞を修飾して、性質・状態・数量を表す。',
    hints: [
      '名詞の直前に来る（a big house の big）',
      'be動詞や become / look / feel などの後ろで、主語の様子を説明する',
      '-ful / -less / -ous / -ive / -able / -al で終わる語は形容詞であることが多い',
      'very で強められ、比較級・最上級（-er / -est、more / most）になる',
    ],
    examples: ['a [beautiful] flower', 'The movie was [exciting].'],
  },
  adverb: {
    role: '動詞・形容詞・他の副詞・文全体を修飾し、様子・程度・頻度・時・場所を表す。',
    hints: [
      '-ly で終わる語が多い（quickly）。ただし friendly / lovely は形容詞',
      'very / too / always / often / never / here / now / yesterday など',
      '取り除いても文が成り立つことが多い',
      '疑問詞の when / where / why / how も副詞',
    ],
    examples: ['She runs [quickly].', 'I [often] go there.'],
  },
  preposition: {
    role: '名詞・代名詞の前に置いて、場所・時・方向・手段などの関係を表す。',
    hints: [
      'in / on / at / to / for / with / from / by / of / about など',
      '後ろに名詞・代名詞（目的格）・動名詞が来る',
      '「前置詞 ＋ 名詞」のまとまりで、形容詞や副詞の働きをする',
      'to の後ろが動詞の原形なら前置詞ではなく「to不定詞」',
    ],
    examples: ['The book is [on] the desk.', "I'll meet you [at] seven."],
  },
  conjunction: {
    role: '語と語、句と句、文と文をつなぐ。',
    hints: [
      'and / but / or / so：対等な関係でつなぐ（等位接続詞）',
      'because / when / if / although / that：主節に文をくっつける（従属接続詞）',
      '従属接続詞の後ろには「主語 ＋ 動詞」が続く',
      'when が疑問文の文頭にあるときは接続詞ではなく副詞',
    ],
    examples: ['I like tea [and] coffee.', 'I stayed home [because] it was raining.'],
  },
  'definite-article': {
    role: 'the のこと。話し手と聞き手の間で「どれのことか特定できる」名詞の前に付く。',
    hints: [
      '一度話題に出た名詞や、the sun のように一つしかないものに付く',
      '単数・複数、数えられる・数えられないを問わず使える',
      '母音の発音で始まる語の前では「ジ」と読む',
    ],
    examples: ['[The] sun rises in the east.', 'I bought a pen. [The] pen is blue.'],
  },
  'indefinite-article': {
    role: 'a / an のこと。数えられる名詞の単数形の前に付き、「（不特定の）ひとつの」を表す。',
    hints: [
      '母音の発音で始まる語の前では an になる（an apple / an hour）',
      '複数形や数えられない名詞には付かない',
      '初めて話題に出すものや、職業・種類を言うときに使う',
    ],
    examples: ['I have [a] dog.', 'She is [an] engineer.'],
  },
  interjection: {
    role: '驚き・喜び・呼びかけ・応答などの気持ちを表す。他の語と文法的に結びつかない。',
    hints: [
      'oh / wow / ah / oops / hey / hello / yes / no など',
      '文頭に置かれ、コンマや「!」で区切られることが多い',
    ],
    examples: ["[Wow], that's amazing!", '[Oh], I see.'],
  },
  'to-infinitive': {
    role: 'to ＋ 動詞の原形。文の中で名詞・形容詞・副詞の働きをする（用法を選べる）。',
    hints: [
      '名詞的用法：「〜すること」。主語・目的語・補語になる（I want to sleep.）',
      '形容詞的用法：「〜するための」「〜すべき」。直前の名詞を修飾する（something to drink）',
      '副詞的用法：「〜するために」（目的）、「〜して」（感情の原因）など',
      'to の後ろが名詞なら to不定詞ではなく「前置詞」',
    ],
    examples: ['I want [to sleep].', 'I have something [to drink].', 'I went out [to buy] milk.'],
  },
  other: {
    role: '上のどれにも当てはまらない語。',
    hints: [
      '数字や記号など、品詞を付けにくいもの',
      'どの品詞か判断に迷う語の一時的な置き場所として',
    ],
    examples: [],
  },
};

/** 例文を、強調する部分（`[...]`）とそれ以外に分ける。 */
export function parseExample(example: string): { text: string; highlight: boolean }[] {
  return example
    .split(/\[([^\]]+)\]/)
    .map((text, i) => ({ text, highlight: i % 2 === 1 }))
    .filter((part) => part.text !== '');
}
