# 転職活動トラッカー

会社名・会社情報・応募経路・選考日程・面接の印象をまとめて管理する個人用の転職活動記録アプリです。
Next.js + Supabase で作られており、ログインすればどの端末のブラウザからでも同じデータを見られます。

## 機能

- 会社ごとに記録: 会社名、会社情報(自由記述)、企業サイトURL、応募経路、全体ステータス
- 選考ステージを複数登録: 書類選考・一次面接・二次面接・最終面接など、それぞれに日程・印象メモ・結果を記録
- トップページで次の選考予定を一覧表示
- メール+パスワードでログインし、データはユーザーごとに分離(Supabase の Row Level Security)

## セットアップ手順

### 1. Supabase プロジェクトを作成

1. https://supabase.com にアクセスし、Google アカウント (`mk.tsuchiya8@gmail.com` など) でログイン/サインアップ
2. 「New project」で新規プロジェクトを作成(プラン: Free で十分)
3. プロジェクト作成後、左メニューの **SQL Editor** を開き、[`supabase/schema.sql`](supabase/schema.sql) の中身を貼り付けて実行
   - `companies` テーブルと `interview_stages` テーブル、Row Level Security ポリシーが作成されます
4. 左メニューの **Project Settings → API** を開き、以下をメモ
   - `Project URL`
   - `anon public` キー

### 2. 環境変数を設定

```bash
cp .env.local.example .env.local
```

`.env.local` を開き、先ほどメモした値を入力:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxx
```

### 3. ローカルで起動

```bash
npm install
npm run dev
```

http://localhost:3000 を開き、「アカウントを作成」からメールアドレスとパスワードでサインアップ → 確認メールのリンクをクリック → ログイン。

### 4. どの端末からもアクセスできるようにする(任意)

ローカルの `npm run dev` は自分のPCでしか開けません。スマホなど他の端末からも使いたい場合は Vercel に無料でデプロイできます。

1. https://vercel.com にログイン(GitHubアカウント連携が簡単)
2. このプロジェクトを GitHub リポジトリに push
3. Vercel で「Add New Project」→ そのリポジトリを選択
4. 環境変数 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を Vercel の設定画面で入力
5. デプロイ後に発行される URL をどの端末からも開けば、同じアカウントでログインするだけでデータが同期されます

Supabase の **Authentication → URL Configuration** で `Site URL` をデプロイ後のURL(例: `https://your-app.vercel.app`)に設定しておくと、確認メールのリンクが正しく機能します。

### 5. 会社名サジェストを国税庁データで強化する(任意・推奨)

会社追加フォームの会社名サジェストは標準で2つのソースを使います:

- **登録済みの会社**: 自分がこれまで登録した会社(前株/後株を区別せず検索)
- **Web検索候補**: Clearbit(無料・登録不要)。企業サイトURLの自動入力に使われますが、日本の中小企業のカバー率は低いです

これに加えて、**国税庁の「法人番号公表サイト Web-API」** を設定すると、日本のほぼ全ての登記法人を前株/後株を区別せず検索できるようになります(ただしURLは含まれません — 登記情報なのでURLは元々存在しないため)。

**登録方法**(この作業はご自身のお名前・電話番号・メールアドレスを使うため、ご自身で行ってください):

1. https://www.invoice-kohyo.nta.go.jp/web-api/index.html#cmsprereg を開く
2. 「個人」向けの申込みフォームから、氏名・電話番号・メールアドレスを入力して届出(無料、費用はかかりません)
3. 後日、国税庁から**アプリケーションID(13桁)**がメールで届きます
4. `.env.local` に追記:

```
NTA_APPLICATION_ID=xxxxxxxxxxxxx
```

5. 開発サーバーを再起動すれば、会社名入力時に「国税庁 法人番号(公式)」の候補が出るようになります

設定しない場合でも、他の2つのソース(登録済みの会社・Web検索候補)だけで問題なく動作します。

## データモデル

- `companies`: 会社名、会社情報、企業サイト、応募経路、ステータス(検討中/応募済み/選考中/内定/不合格/辞退)、年収、勤務地、リモート可能日数(週1〜5日)、福利厚生、残業時間の目安、求人要件、志望順位・志望理由、決め手・懸念点
- `interview_stages`: 会社に紐づく選考ステージ(ステージ名、選考日程、実施方法、面接官名、会話内容、面接の印象、結果)

いずれも `user_id` で所有者を区別し、Row Level Security で本人のデータしか読み書きできません。

**既にテーブルを作成済みの場合**は、[`supabase/schema.sql`](supabase/schema.sql) 末尾の `alter table` コメント行(コメントを外して)を SQL Editor で実行し、新しい列を追加してください。
