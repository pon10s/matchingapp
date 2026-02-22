-- Supabase Storage完全セットアップ手順

-- ============================================
-- 1. Storageバケットの作成（Supabase UIで実行）
-- ============================================
-- Storage > Create a new bucket
-- Bucket name: profile-photos
-- Public bucket: ON (チェックを入れる)
-- File size limit: 5MB
-- Allowed MIME types: image/*

-- ============================================
-- 2. RLSポリシーの設定（SQL Editorで実行）
-- ============================================

-- 既存のポリシーを削除
DELETE FROM storage.policies WHERE bucket_id = 'profile-photos';

-- ユーザーは自分のフォルダにアップロード可能
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES (
  'profile-photos',
  'Users can upload own photos',
  '(bucket_id = ''profile-photos''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)'
);

-- 全員が写真を閲覧可能
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES (
  'profile-photos',
  'Public can view photos',
  '(bucket_id = ''profile-photos''::text)'
);

-- ユーザーは自分の写真を更新可能
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES (
  'profile-photos',
  'Users can update own photos',
  '(bucket_id = ''profile-photos''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)'
);

-- ユーザーは自分の写真を削除可能
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES (
  'profile-photos',
  'Users can delete own photos',
  '(bucket_id = ''profile-photos''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)'
);

-- ============================================
-- 3. 確認用SQL
-- ============================================

-- バケットが存在するか確認
SELECT * FROM storage.buckets WHERE name = 'profile-photos';

-- ポリシーが設定されているか確認
SELECT * FROM storage.policies WHERE bucket_id = 'profile-photos';
