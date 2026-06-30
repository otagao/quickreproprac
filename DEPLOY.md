# デプロイ手順 — quickreproprac

デプロイ対象: Cloudflare Pages（静的サイト）+ Cloudflare Workers（ルーティング）

## 構成の概要

```
ブラウザ
  └─► tools.otagao.net/quickreproprac/*
        └─► [Worker: quickreproprac-router]  ← このリポジトリの cloudflare/ 以下
              └─► https://quickreproprac.pages.dev/*
                    └─► [Pages Functions: _middleware.js]
                          │ バイパスヘッダー一致 → そのまま通過してコンテンツを返す
                          └─► pages.dev への直アクセス → 302 で tools.otagao.net/quickreproprac/ へリダイレクト
```

ORIGIN_BYPASS_TOKEN は Worker と Pages の両方に同じ値を設定する共有シークレット。
Worker は pages.dev へのプロキシリクエストにこのトークンをヘッダーで付与し、
_middleware.js がそれを検証して通過させる。直アクセス（トークン無し）は 302 で弾く。

なお Worker は末尾スラッシュ無しの `/quickreproprac` を `/quickreproprac/`（末尾スラッシュ付き）へ
301 リダイレクトする。これはページ内の相対パス（`js/main.js` 等）を `/quickreproprac/` 基準で
解決させ、アセットが 404 にならないようにするため。正規 URL は実質 `tools.otagao.net/quickreproprac/`。

---

## 前提条件

- Node.js / npm がインストール済みであること
- wrangler CLI がインストール済みであること（未インストールの場合: `npm install -g wrangler`）
- otagao.net ゾーンが Cloudflare で管理されていること（既存の itf-gpa-rescaler と同じゾーン）

---

## Step 1: Cloudflare へ認証

```powershell
wrangler login
```

ブラウザが開くので Cloudflare アカウントにログインして認証を完了させる。
CI/CD 環境では `$env:CLOUDFLARE_API_TOKEN = "..."` でトークンを渡す方法も可。

---

## Step 2: Pages プロジェクトを作成

初回のみ実行する（既に存在する場合はスキップ）。

```powershell
wrangler pages project create quickreproprac --production-branch main
```

> **要確認**: `--production-branch` の値はリポジトリの本番ブランチ名に合わせること（デフォルト: `main`）。

---

## Step 3: Pages へ静的サイトをデプロイ

デプロイ対象ディレクトリは `public/`（`public/functions/_middleware.js` も含まれる）。

```powershell
wrangler pages deploy public --project-name quickreproprac
```

成功すると `https://quickreproprac.pages.dev` でアクセス可能になる（ただし _middleware.js により tools.otagao.net へ 302 リダイレクトされる）。

---

## Step 4: ORIGIN_BYPASS_TOKEN を生成する

Worker と Pages で共有するランダムなトークンを生成する。

```powershell
# PowerShell でランダム文字列生成の例
[System.Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Max 256) }))
```

生成した値をメモしておく（以降の Step 5・Step 6 で使用）。

---

## Step 5: Worker をデプロイする

```powershell
cd cloudflare
wrangler deploy
```

デプロイ後、Worker のシークレットを設定する。

```powershell
wrangler secret put ORIGIN_BYPASS_TOKEN
# プロンプトが表示されたら Step 4 で生成したトークンを貼り付けて Enter
```

> **要確認**: `cloudflare/wrangler.toml` の `compatibility_date` を最新日付に更新することを推奨。
> 最新の互換性日付は https://developers.cloudflare.com/workers/configuration/compatibility-dates/ で確認できる。

---

## Step 6: Pages 側にも同じトークンを設定する

Cloudflare ダッシュボード、または CLI で設定する。

### ダッシュボードの場合

1. Cloudflare ダッシュボード → Workers & Pages → `quickreproprac`
2. Settings → Environment variables
3. Production 環境に `ORIGIN_BYPASS_TOKEN` を追加（値は Step 4 のトークン）
4. **Encrypt** にチェックを入れること

### CLI の場合

```powershell
# Pages の環境変数として設定（--env production が本番向け）
wrangler pages secret put ORIGIN_BYPASS_TOKEN --project-name quickreproprac
# プロンプトが表示されたら Step 4 で生成したトークンを貼り付けて Enter
```

設定後、Pages を再デプロイして環境変数を反映させる。

```powershell
cd ..
wrangler pages deploy public --project-name quickreproprac
```

---

## Step 7: 動作確認

### quickreproprac.pages.dev が 302 リダイレクトされることを確認

```powershell
# curl が入っている場合
curl -v -L "https://quickreproprac.pages.dev/" 2>&1 | Select-String "Location|HTTP/"
```

期待する結果: `302` レスポンスで `Location: https://tools.otagao.net/quickreproprac` へリダイレクトされること。

### 正規 URL でアクセスできることを確認

ブラウザで `https://tools.otagao.net/quickreproprac` を開き、アプリが正常に表示されることを確認する。

---

## 既存 Worker との共存について（要確認）

既存の `tools-router` Worker（itf-gpa-rescaler 用）と今回の `quickreproprac-router` Worker は
**独立した別 Worker** として並走する設計になっている。

- `tools-router` は `/itf-gpa-rescaler/*` ルートを担当
- `quickreproprac-router` は `/quickreproprac/*` ルートを担当

routes のパターンが重複しない限り競合しないが、デプロイ前に Cloudflare ダッシュボード →
Workers & Pages → ルート設定で `/quickreproprac/*` が既存の Worker に割り当てられていないことを確認すること。

---

## トラブルシューティング

### `_middleware.js` が動作しない（リダイレクトされない）

- Pages のデプロイに `public/functions/_middleware.js` が含まれているか確認する
- `wrangler pages deploy public` の出力に `functions/_middleware.js` が含まれているか確認する

### Worker が 404 を返す

- `wrangler.toml` のルートパターン（`tools.otagao.net/quickreproprac` と `tools.otagao.net/quickreproprac/*`）が正しく設定されているか確認する
- `wrangler deploy` が成功しているか確認する

### リダイレクトループが発生する

- Worker 側と Pages 側の `ORIGIN_BYPASS_TOKEN` が**同じ値**で設定されているか確認する
- Pages を再デプロイして環境変数が反映されているか確認する
