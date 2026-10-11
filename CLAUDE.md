# unbind

英文を単語・句に分解して品詞や訳を付けて学習する Web アプリ。
**Hono + Inertia + React 19** 構成（サーバがルーティングとデータ取得を担い、React ページへ props を注入する）。
TypeScript(strict) + Vite+（vite-plus）。デプロイ先は **Cloudflare Workers**（`@hono/vite-build/cloudflare-workers` でビルド。データは KV に保存）。
構成の要点・落とし穴は `app/` 配下と、この後の「アーキテクチャの要点」を参照。

## コマンド（npm/pnpm ではなく vp を使う）

lint / format はパッケージマネージャではなく vite-plus の `vp` CLI で行う。

- チェック一括（lint + format 検査）: `vp check` / 自動修正: `vp check --fix`
- フォーマットのみ: `vp fmt`（`singleQuote`）
- 型チェック: `npm run typecheck`（= `tsc -b --noEmit`。solution 構成なので `-b` が必須。`tsc --noEmit` 単体では何も検査しない）
- 開発サーバ: `npm run dev`（cmk watch + `vp dev`。Hono を Vite ミドルウェアとして実行し http://localhost:5173 で配信）
- ビルド: `npm run build`（`generate` → `build:client`（`vp build`）→ `build:server`（`vp build --mode server` = Workers エントリ `dist-server/index.js`）の順。サーバは client のマニフェストを参照するため client → server の順が必須）
- ローカルで Workers ランタイム確認: `npm run preview`（`build` → `wrangler dev`。http://localhost:8787。KV は Miniflare のローカル模擬）
- 本番デプロイ: `npm run deploy`（`build` → `wrangler deploy`。事前に `wrangler kv namespace create UNBIND_KV` で作った id を `wrangler.jsonc` に設定・`wrangler login` が必要）
- テスト: `npm test`（= `vp test run`）／ウォッチ: `npm run test:watch`（詳細は後述の「テスト」）
- Storybook: `npm run storybook`（http://localhost:6006）／静的ビルド: `npm run build-storybook`（`storybook-static/`）
- **CSS Module のクラスを追加/削除したら `npm run generate`**（cmk が型を再生成。これを忘れると型が古いまま typecheck が通ってしまう）

## TypeScript 規約（型/リンタが強制するので違反するとエラー）

- `verbatimModuleSyntax` → 型のインポートは必ず `import type { ... }`
- `erasableSyntaxOnly` → `enum` と `namespace` は使わない
- `noUnusedLocals` / `noUnusedParameters` → 未使用の変数・引数を残さない
- 値の絞り込みに `as` を使わず、型ガードで行う（oxlint `no-unsafe-type-assertion`）。
  避けられない箇所（例: `JSON.parse` の結果）は理由コメント付きで `// eslint-disable-next-line` する
- `src` 配下は `@/` エイリアスで参照できる（`@/types` など）

## CSS Modules

- クラス名は **camelCase** で書く（例: `.sentenceList`）／TS 側は `styles.sentenceList` とドット参照
- 共通ボタンは `src/styles/button.module.css` を `buttonStyles` として import して使う
- CSS カスタムプロパティ（`--accent` 等）は全て `src/index.css` に集約（light / dark 両方定義済み）。
  色や余白のトークンを増やすときもここに追加する
- 型は cmk が `generated/` に生成する。`generated/**` は tsconfig の include・lint・format のいずれからも除外されている（手で編集しない）

## アーキテクチャの要点

- **`app/`＝サーバ + Inertia ページ、`src/`＝共有コード**（`@/` エイリアスは `src` を指す）
  - `app/server.tsx`: Hono ルート。**ルートは必ずメソッドチェーンで書く**（`new Hono().use(...).get(...).post(...)`）。別文の `app.get()` だと型がスキーマに蓄積されず、`PageProps<'...'>` が `never` になる
  - `app/store.ts`: データ層。**Cloudflare KV** 実装（全 sentences を 1 キー `sentences` に JSON 配列で保存）。KV バインディングは `c.env` からしか取れないため各関数は第 1 引数に `KVNamespace` を受け取る。関数シグネチャ・戻り値は REST API 形（`fetchSentences` = `GET /api/sentences` 等）に寄せてある。DB（D1 等）導入時は中身だけ差し替える前提。※全件ロード方式なので件数増による重さは JSON 時代と同等 — スケールさせるなら D1 + サーバ側ページングへ
  - `wrangler.jsonc`: Workers 設定（`main`=Workers エントリ、`assets`=`dist` を静的配信、`kv_namespaces` の `UNBIND_KV`）。`id` は各自の KV を作って設定する（プレースホルダのまま）
  - `vite.config.ts`: `mode=server` ビルドは `cloudflareWorkersBuild`。dev は `@hono/vite-dev-server` の `cloudflareAdapter` で `c.env`（KV）を Miniflare 経由注入するので `npm run dev` でも KV が使える
  - `app/root-view.tsx`: HTML シェル。**Inertia の初期ページは `<script data-page="app" type="application/json">` の textContent で渡す**（v3 の `getInitialPageFromDOM` がこのセレクタで読む。`<div data-page>` 属性ではない）
  - `app/pages.gen.ts`: `@hono/inertia/vite` が `vp dev` / `vp build` 時に自動生成（`PageProps<C>` の型元）。手編集禁止。**Git 管理対象**（CI の型チェック付き lint がこのファイルを必要とするため）なので、ページを追加・削除したら再生成された差分もコミットする
  - `src/client.tsx`: `createInertiaApp`（クライアントエントリ）
- データ取得・遷移・保存は Inertia 方式:
  - 取得: サーバの `c.render('Sentences/Xxx', props)` → ページは `PageProps<'Sentences/Xxx'>` で受領（`useEffect + fetch` は不要）
  - 遷移: `@inertiajs/react` の `<Link>` / `router.visit`（クライアントルータは無し）
  - 変更: `router.post/put/delete` → サーバは `c.redirect(url, 303)` で返す
  - `router.post/put` のペイロードは **`src/inertia.ts` の `toPayload()`** を通す（interface 由来のドメイン型は `RequestPayload` の index signature に構造的一致しないため。理由コメント付き `as` を 1 箇所に集約）
- 一覧の絞り込み・ページングは当面クライアント側（全件を props で受け、フィルタは state + `history.replaceState` で URL 同期）
- Storybook（`.storybook/`）:
  - ルートの `vite.config.ts` は使わず `.storybook/vite.config.ts`（react + `@` エイリアスのみ）でビルドする。Hono dev サーバ等のプラグインを Storybook に持ち込まないため
  - `@inertiajs/react` はエイリアスで `.storybook/mocks/inertia.tsx` に差し替わる（`router.*` は `fn()` で Actions に記録、`<Link>` は遷移しない）
  - コンポーネントのストーリーは `src/**` に同居、**ページのストーリーは `app/stories/` に置く**（`app/pages` 配下に置くと `inertiaPages()` がページ名として拾い、`src/client.tsx` の glob でクライアントバンドルにも入る）
  - サンプルデータは `src/fixtures/`
- Token 型は DB スキーマ対応: `Token`（sentences 相当）+ `TokenAnalysis`（token_analyses 相当）を `TokenWithAnalysis` に結合してフロントで扱う
- 複数語のまとまりは 2 種類: 隣接トークンを 1 つに結合する**隣接フレーズ**（`Token.memberTexts` + `idiomMeaning`）と、トークンを結合せず ID で参照する**パターン**（`Sentence.patterns`。熟語・慣用句・文法パターンを扱い、隣接していない単語の組み合わせも可・単語ごとの分析を保てる）。フレーズの結合・分解時は `src/patterns.ts` の `replacePatternTokens` でパターンの参照を追従させる

## テスト

テストの構成・書き方・落とし穴は `docs/testing.md` にまとめている（以下で読み込む）。

@docs/testing.md

## 運用

- 応答・コミットメッセージ・PR は日本語で書く
- コミットは `feat:` / `docs:` などの接頭辞 + 日本語の要約 + `(#issue番号)` の形式（例: `feat: ページング機能を作成(#21)`）
