# Supabase Storage設定手順

## 画像アップロード機能を有効にするための設定

### 1. Storageバケットの作成

Supabaseダッシュボード → Storage → Create a new bucket

- Bucket name: `profile-photos`
- Public bucket: ✅ チェックを入れる（公開バケット）
- File size limit: 5MB
- Allowed MIME types: `image/*`

### 2. バケットポリシーの設定

Storage → profile-photos → Policies → New Policy

**アップロードポリシー（INSERT）:**
```sql
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**読み取りポリシー（SELECT）:**
```sql
CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');
```

**削除ポリシー（DELETE）:**
```sql
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. 設定完了確認

- バケット一覧に `profile-photos` が表示される
- Public URL が有効になっている
- ポリシーが3つ設定されている

これで画像アップロード機能が使用可能になります。
