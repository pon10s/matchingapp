# Match Log UI統一 - 変更サマリ

## 📋 デザイントークン（CSS変数）

### 追加したトークン
```css
--color-primary: #a8c5e3;
--color-secondary: #d4b5d3;
--color-accent: #f5d5cb;
--color-text-main: #4a5568;
--color-text-light: #9ca3af;
--color-white: #ffffff;
--color-card-bg: rgba(255, 255, 255, 0.7);

--radius-card: 24px;
--radius-pill: 999px;
--radius-medium: 16px;

--shadow-soft: 0 10px 30px rgba(80, 110, 150, 0.12);
--shadow-card: 0 4px 16px rgba(100, 120, 160, 0.06);

--spacing-xs: 8px;
--spacing-sm: 12px;
--spacing-md: 16px;
--spacing-lg: 20px;
--spacing-xl: 24px;
```

## 🎨 変更内容（ページ別）

### 1. style.css（共通スタイル）
**UI変更点:**
- 背景をindex基準のグラデーション（#e8f1f8 → #f5e8f3 → #fef3ed）に統一
- headerをガラスモーフィズム（半透明+blur）に変更
- sectionをカード風（角丸24px、柔らかい影）に統一
- ボタンを淡いブルー基調の丸ボタンに統一
- 旧ナビゲーション（.main-nav）を非表示
- 旧ログアウトボタン（.logout-bottom）を非表示
- bottom-navスタイルを追加（index/profiles基準）

**機能維持:**
- 既存のID/class/data属性は全て維持
- 既存のフォーム要素、テーブル、アバター表示は維持
- レスポンシブ対応は維持

### 2. events.html（デート登録）
**UI変更点:**
- app-containerで囲み、max-width 430pxに統一
- headerにロゴ+タイトル+ログアウトボタン配置
- 旧ナビゲーションを削除、bottom-navに置き換え
- footerを削除

**機能維持:**
- `#event-form`、`#eventId`、`#profileSelect`、`#eventDate`、`#commentField`、`#eventNote`、`#eventSubmitBtn`、`#editingIndicator` 全て維持
- events.jsの既存ロジック（Supabaseからプロフィール取得、イベント登録/更新）は非破壊

### 3. calendar.html（戦歴）
**UI変更点:**
- app-containerで囲み、統一レイアウト適用
- headerにロゴ+タイトル+ログアウトボタン配置
- 旧ナビゲーションを削除、bottom-navに置き換え
- footerを削除

**機能維持:**
- `#sortDescBtn`、`#sortAscBtn`、`#calendar-table` 全て維持
- calendar.jsの既存ロジック（Supabaseからイベント取得、並び替え、テーブル描画）は非破壊

### 4. account.html（アカウント管理）
**UI変更点:**
- app-containerで囲み、統一レイアウト適用
- headerにロゴ+タイトル+ログアウトボタン配置
- 旧ナビゲーションを削除、bottom-navに置き換え
- footerを削除

**機能維持:**
- `#current-email`、`#current-nickname`、`#nickname-form`、`#new-nickname`、`#email-form`、`#new-email`、`#password-form`、`#new-password`、`#new-password-confirm`、`#delete-account-btn`、`#line-status`、`#line-not-connected`、`#line-connected`、`#line-connect-btn`、`#line-disconnect-btn` 全て維持
- account.jsの既存ロジック（Supabase認証、LINE連携、アカウント削除）は非破壊

### 5. edit-profile.html（プロフィール編集）
**UI変更点:**
- app-containerで囲み、統一レイアウト適用
- headerにロゴ+タイトル（動的変更可能）+ログアウトボタン配置
- 旧ナビゲーションを削除、bottom-navに置き換え
- footerを削除

**機能維持:**
- `#page-title`、`#profile-form`、`#profileId`、`#name`、`#age`、`#height`、`#education`、`#income`、`#occupation`、`#residence`、`#status`、`#endReasonFields`、`end_reason_type`、`#end_reason_detail`、`#app`、`#summary`、`#memo`、`#photo`、`#photoPreviewContainer`、`#photoPreview`、`#cropBtn`、`#cancelBtn` 全て維持
- edit-profile.jsの既存ロジック（Supabaseからプロフィール取得/保存、Cropper.js、画像アップロード）は非破壊

### 6. profile-detail.html（プロフィール詳細）
**UI変更点:**
- app-containerで囲み、統一レイアウト適用
- headerにロゴ+タイトル+ログアウトボタン配置
- 旧ナビゲーションを削除、bottom-navに置き換え
- footerを削除

**機能維持:**
- `#detail-section`、`#detail-buttons`、`#editBtn`、`#deleteBtn`、`#addEventBtn`、`#backBtn` 全て維持
- profile-detail.jsの既存ロジック（Supabaseからプロフィール+イベント取得、詳細表示、削除）は非破壊

### 7. edit-event.html（デート編集）
**UI変更点:**
- app-containerで囲み、統一レイアウト適用
- headerにロゴ+タイトル+ログアウトボタン配置
- 旧ナビゲーションを削除、bottom-navに置き換え
- footerを削除

**機能維持:**
- `#edit-event-form`、`#eventId`、`#profileSelect`、`#eventDate`、`#eventType`、`#eventNote`、`#deleteBtn`、`#cancelBtn` 全て維持
- edit-event.jsの既存ロジック（Supabaseからイベント取得/更新/削除）は非破壊

## ✅ 動作確認チェックリスト

### 基本機能
- [ ] ログイン/ログアウトが正常に動作する
- [ ] 全ページでbottom-navが表示され、ページ遷移できる
- [ ] headerのログアウトボタンが動作する

### プロフィール機能
- [ ] プロフィール一覧が表示される（DBから取得）
- [ ] 検索機能が動作する（リアルタイム検索）
- [ ] ステータスフィルタが動作する
- [ ] 新規登録ボタンでedit-profile.htmlに遷移する
- [ ] プロフィール行クリックでprofile-detail.htmlに遷移する
- [ ] プロフィール詳細が表示される（DBから取得）
- [ ] プロフィール編集が動作する（DB更新）
- [ ] プロフィール削除が動作する（DB削除）
- [ ] 画像アップロード+トリミングが動作する（Cropper.js）

### デート機能
- [ ] デート登録フォームでプロフィール一覧が表示される（DBから取得）
- [ ] デート登録が動作する（DB挿入）
- [ ] 戦歴ページでイベント一覧が表示される（DBから取得）
- [ ] 並び替え（最近/歴史）が動作する
- [ ] イベント行クリックでedit-event.htmlに遷移する
- [ ] デート編集が動作する（DB更新）
- [ ] デート削除が動作する（DB削除）

### ホーム機能
- [ ] 統計カード（登録相手、今後の予定、更新待ち）が表示される（DBから取得）
- [ ] AIアドバイスが表示される（Gemini API）
- [ ] グラフ（ステータス別、月別、アプリ別）が表示される（Chart.js + DBデータ）
- [ ] 予定が終わったデートリストが表示される（DBから取得）
- [ ] 感想+ステータス更新が動作する（DB更新）

### アカウント機能
- [ ] アカウント情報が表示される（Supabase Auth）
- [ ] ニックネーム変更が動作する（DB更新）
- [ ] メールアドレス変更が動作する（Supabase Auth）
- [ ] パスワード変更が動作する（Supabase Auth）
- [ ] LINE連携状態が表示される（DBから取得）
- [ ] LINE連携/解除が動作する（DB更新）
- [ ] アカウント削除が動作する（DB削除）

### レスポンシブ
- [ ] スマホ（375px）で正常に表示される
- [ ] タブレット（768px）で正常に表示される
- [ ] PC（1200px）で正常に表示される
- [ ] bottom-navがスマホで適切に表示される

## 📝 備考

- **非破壊原則**: 全てのID、data属性、既存イベントハンドラ、Supabase取得ロジックは変更していません
- **ダミーデータなし**: 全て既存のDB取得関数を使用しています
- **CSS追加のみ**: 既存CSSは上書きせず、新規クラスとトークンを追加しました
- **DOM変更最小限**: app-containerとbottom-navのwrapper追加のみで、既存要素は維持しています
