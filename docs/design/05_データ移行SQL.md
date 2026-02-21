# データ移行SQL

## 既存データの移行手順

### 年収フィールドの移行

年収が数値型から選択式（VARCHAR）に変更されたため、既存データを適切な範囲に変換します。

```sql
-- 年収データの移行（数値を選択肢に変換）
UPDATE profiles
SET income = CASE
  WHEN income::integer < 300 THEN '300万円未満'
  WHEN income::integer >= 300 AND income::integer < 500 THEN '300-500万円'
  WHEN income::integer >= 500 AND income::integer < 700 THEN '500-700万円'
  WHEN income::integer >= 700 AND income::integer < 1000 THEN '700-1000万円'
  WHEN income::integer >= 1000 THEN '1000万円以上'
  ELSE NULL
END
WHERE income IS NOT NULL 
  AND income ~ '^[0-9]+$';  -- 数値のみの場合に実行
```

### 実行前の確認

```sql
-- 現在の年収データを確認
SELECT income, COUNT(*) 
FROM profiles 
WHERE income IS NOT NULL 
GROUP BY income 
ORDER BY income;
```

### 実行後の確認

```sql
-- 移行後のデータを確認
SELECT income, COUNT(*) 
FROM profiles 
GROUP BY income 
ORDER BY income;
```

## 注意事項

- このSQLは既存の数値データを選択肢に変換します
- すでに選択肢形式で入力されているデータには影響しません
- バックアップを取ってから実行することを推奨します
