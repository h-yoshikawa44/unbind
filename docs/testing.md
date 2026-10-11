# テスト

Vitest（vite-plus 同梱）+ Testing Library。設定は `vite.config.ts` の `test`。

## コマンド

- 全テスト: `npm test`（= `vp test run`）／ウォッチ: `npm run test:watch`
- プロジェクト単位: `vp test run --project client` / `vp test run --project server`
- CI（`.github/workflows/develop.yml`）でも lint の後に `npm test` を実行する

## 共通ルール

- テスト API は `vitest` ではなく **`vite-plus/test`** から import する（`import { describe, expect, it, vi } from 'vite-plus/test'`）
- `mode=test` では `vite.config.ts` のプラグインを `react()` のみにしている（Hono dev サーバ等を起動しないため）
- テストは Vitest の projects で 2 つに分かれる

| project  | 環境  | 対象                         | 置き場所                                         |
| -------- | ----- | ---------------------------- | ------------------------------------------------ |
| `client` | jsdom | コンポーネント・ページの描画 | `src/**/*.test.tsx`, `app/stories/**/*.test.tsx` |
| `server` | node  | Hono のルート・データ層      | `app/*.test.ts`                                  |

## client: コンポーネント・ページのテスト

- セットアップは `src/test/setup.ts`（Storybook の preview 適用・cleanup・mock の呼び出し履歴と URL のリセット）
- **`composeStories(stories)` でストーリーを流用して描画する**。コールバックはストーリーの args にある `fn()` を `Story.args.onXxx` で検証する。props の上書きは `<Story value={...} />`

  ```tsx
  const { Default } = composeStories(stories);

  render(<Default value={['過去文', '句動詞']} />);
  await user.click(screen.getByRole('button', { name: 'タグ「過去文」を削除' }));
  expect(Default.args.onChange).toHaveBeenCalledWith(['句動詞']);
  ```

- ストーリーの `useArgs` による args 書き戻しはテストでは再描画されない。制御コンポーネントは「`value` が表示に反映される」と「`onChange` に正しい値が渡る」を分けて検証する
- コンポーネントのテストは `src/components/X/X.test.tsx`（ストーリー・実装と同じディレクトリ）

### テスト観点

ユーザから見える振る舞い（表示と操作の結果）を検証し、内部実装（state の変数名やクラス名）には依存しない。

| 観点                 | 何を確かめるか                                                         | 例                                                                                                    |
| -------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| props の反映         | 渡した props が表示・入力値・選択状態に反映される                      | `value` のタグがチップで出る、`selectedTags` のボタンが `aria-pressed` になる                         |
| 条件付き表示         | props や state に応じて要素が出る／出ない                              | 名詞なら「数」の選択欄だけ出る、`onSplit` が無ければ分解ボタンを出さない、0 件時の文言                |
| コールバック         | 操作に対して正しい引数でコールバックが呼ばれる（呼ばれないことも含む） | 空白を除いたタグ配列で `onChange`、確認ダイアログでキャンセルしたら `onDelete` を呼ばない             |
| 入力の正規化・ガード | 前後空白・重複・空入力・範囲外などの扱い                               | 重複タグは追加しない、空白だけでは送信ボタンが無効                                                    |
| 内部 state の更新    | 操作によって state が変わり、表示とその後の出力に反映される            | SentenceEditor: 品詞変更がチップに反映 → 保存で更新後のトークンを渡す、保存後は保存ボタンが無効に戻る |
| ページの通信・遷移   | ページが正しい URL・ペイロードで `router.*` を呼ぶ                     | 保存で `router.put('/sentences/:id', …)`、新規作成で tokenize 済みのペイロードを `router.post`        |
| ページのロジック     | ページが持つ絞り込み・ページング・URL 同期の実際の結果                 | タグ・キーワードの AND 絞り込み、20 件ずつのページング、URL クエリからの状態復元                      |

#### コンポーネントとページの分担

- **コンポーネント**: props → 表示、操作 → コールバック引数、を単体で検証する。制御コンポーネントの「状態の持ち主」は親なので、表示の追従は検証しない（上記 `useArgs` の制約も参照）
- **ページ**: コンポーネントを組み合わせた結果を検証する。SentenceList は絞り込みの入力 UI だけを持ち、実際に絞り込むのは Index ページなので、絞り込み結果は Index のテストで確かめる

#### 書き方の指針

- 要素は **role とアクセシブルな名前** で探す（`getByRole('button', { name: '保存' })`）。ラベルが紐づいていない入力は `getByDisplayValue` / `getByPlaceholderText` を使い、クラス名や DOM 構造には依存しない
- 操作は `userEvent.setup()` の `user.click` / `user.type` / `user.selectOptions` で行う（`fireEvent` より実際の操作に近い）
- 1 つのテストでは 1 つの振る舞いを確かめ、テスト名は「〜すると〜になる」の形で日本語で書く
- 見た目（CSS・レイアウト）は検証しない。見た目の確認は Storybook で行う

### ページのテスト

- **`app/stories/` にストーリーと並べて置く**。`app/pages` 配下は不可（`inertiaPages()` がページ名として拾い、`src/client.tsx` の glob でクライアントバンドルにも入る）
- `@inertiajs/react` は `test.alias` で Storybook と同じ `.storybook/mocks/inertia.tsx` に差し替わる（`router.*` は `fn()`、`<Link>` はクリックで `router.visit` を呼ぶだけ）
- `router.*` の検証はモックを相対パスで直接 import して行う（`@inertiajs/react` 経由だと実型のメソッドになり oxlint の `unbound-method` に掛かる）

  ```tsx
  import { router } from '../../../.storybook/mocks/inertia';

  expect(router.put).toHaveBeenCalledWith('/sentences/s1', { ... });
  ```

- Index ページの URL 同期（`history.replaceState`）は、`setup.ts` でテストごとに `/` へ戻している。初期状態の復元を見るときは `render` 前に `window.history.replaceState({}, '', '/?tags=...')` する
- `window.confirm` は `vi.spyOn(window, 'confirm').mockReturnValue(true)` で差し替える（`setup.ts` の `vi.restoreAllMocks()` で戻る）

## server: ルート・データ層のテスト

- `app/server.test.ts`: Hono の `app.request(path, init, { UNBIND_KV: kv })` でルートを叩く
  - `X-Inertia: true` を付けると HTML ではなくページオブジェクト（`{ component, props, url, version }`）が JSON で返るので、それを検証する
  - POST / PUT は `Content-Type: application/json` で送る（Inertia の `router.post/put` と同じ）。成功時は 303 + `Location`、ボディ不正は zod-validator により 400
  - 日時は `vi.useFakeTimers({ toFake: ['Date'] })` + `vi.setSystemTime()` で固定する
- `app/store.test.ts`: ルート経由では確かめられない部分（id の自動採番、エラーメッセージ変換など）だけを検証する
- KV は `app/test/fake-kv.ts` のインメモリ実装を使う
  - `createFakeKV({ sentences })` で初期データ、`raw` で生文字列（JSON 破損の再現）、`failOnGet` で読み込みエラーを再現できる
  - 保存結果は `savedSentences()`（スキーマ検証済み）/ `rawValue()` で確認する
- データ異常時に `store.ts` が出す `console.error` は、`vi.spyOn(console, 'error').mockImplementation(() => {})` で黙らせる
- タグの並び順は `localeCompare('ja')` なので、漢字は読み順ではなく JIS 順（例: 「過去文」が「句動詞」より先）

### テスト観点

HTTP の入出力（レスポンスのステータス・ヘッダ・ページオブジェクト）と、KV に保存された結果を検証する。`store.ts` の関数を直接モックせず、フェイクの KV を通して実際の読み書きまで動かす。

| 観点                   | 何を確かめるか                                                                | 例                                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 描画するページと props | GET で正しいページ（`component`）に正しい props を渡す                        | `/` は `Sentences/Index` に英文一覧とタグ一覧、存在しない id の詳細は `sentence: null`               |
| データの整形           | 並び順・重複排除・既定値の補完                                                | 英文は更新日の新しい順、タグは重複なしで照合順、古いデータの `naturalTranslation` / `tags` を補完    |
| 保存内容               | POST / PUT / DELETE の後に KV に保存された値                                  | タグの正規化、`createdAt` / `updatedAt` の設定、更新で作成日時・英文を変えない、削除で他の英文が残る |
| リダイレクト           | 変更系の成功時に 303 と `Location` を返す                                     | 作成・更新は詳細へ、削除は一覧へ                                                                     |
| 入力検証               | 不正なボディを 400 で弾き、何も保存しない                                     | `text` 欠落、`tags` が配列でない、存在しない品詞                                                     |
| データ異常時の挙動     | KV の破損・スキーマ不一致・読み込み失敗でアプリを落とさず、エラーページを出す | 種別ごとのメッセージ（取得失敗／予期しないデータ）、壊れたデータを上書きしない                       |
| 存在しない対象         | 存在しない id への操作の扱い                                                  | 更新はエラーページ、削除は何もせずリダイレクト                                                       |
| HTML シェル            | 通常アクセスで初期ページを埋め込んだ HTML を返す                              | `<script data-page="app" type="application/json">` に Index のページオブジェクトが入る               |

#### ルートとデータ層の分担

- **ルート（`server.test.ts`）**: ほとんどの観点はここで、HTTP 経由で検証する。ルートの振る舞いとデータ層の処理（整形・正規化・エラー変換）をまとめて確かめられるため
- **データ層（`store.test.ts`）**: ルートからは到達できない分岐だけを検証する（`id` 省略時の UUID 採番、英字を含むタグの並び順、`toDataErrorMessage` の変換）。ルートで確認済みのことは重複して書かない

#### 書き方の指針

- 1 つのテストは「KV の初期状態を用意 → リクエスト → レスポンスと KV を検証」の順で書く
- 保存結果は、変更した項目だけでなく英文全体を `toEqual` で比べる（意図しない項目の変更も検出するため）
- 失敗系では「エラーを返すこと」に加えて「保存していないこと」も確かめる
- 期待値はテストに直接書き、実装と同じ計算（ソート・正規化）をテスト内で再現しない
