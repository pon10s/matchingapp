-- Supabase Storage設定確認とRLS設定

-- 1. profile-photosバケットが存在するか確認
SELECT * FROM storage.buckets WHERE name = 'profile-photos';

-- 2. profile-photosバケットのRLSポリシーを確認
SELECT * FROM storage.policies WHERE bucket_id = 'profile-photos';

-- 3. RLSポリシーを削除して再作成
DELETE FROM storage.policies WHERE bucket_id = 'profile-photos';

-- 4. 新しいRLSポリシーを作成
-- ユーザーは自分のフォルダにのみアップロード可能
INSERT INTO storage.policies (bucket_id, name, definition, check_definition)
VALUES 
  ('profile-photos', 'Users can upload own photos', 
   '(bucket_id = ''profile-photos''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)',
   '(bucket_id = ''profile-photos''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)');

-- 5. 全員が写真を閲覧可能
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES 
  ('profile-photos', 'Public can view photos', 
   '(bucket_id = ''profile-photos''::text)');

-- 6. ユーザーは自分の写真を削除可能
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES 
  ('profile-photos', 'Users can delete own photos', 
   '(bucket_id = ''profile-photos''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)');
