# LINE通知の定期実行設定（Cron）

## 概要

毎日20:00（JST）に自動でLINE通知を送信する設定です。

## 設定方法

### 方法1: Supabase Dashboard（推奨）

1. **Supabase Dashboard** → **Database** → **Cron Jobs**
2. 「Create a new cron job」をクリック
3. 以下を入力：

```sql
-- Job名: daily-line-notifications
-- Schedule: 0 11 * * * (毎日11:00 UTC = 20:00 JST)
-- SQL:
SELECT
  net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  ) as request_id;
```

4. 「Save」をクリック

### 方法2: SQL Editor

```sql
-- pg_cron拡張を有効化（初回のみ）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Cron Jobを作成
SELECT cron.schedule(
  'daily-line-notifications',
  '0 11 * * *',  -- 毎日11:00 UTC = 20:00 JST
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

## 設定値の確認

### プロジェクトREF

Supabase Dashboard → Settings → General → Reference ID

### Service Role Key

Supabase Dashboard → Settings → API → service_role (secret)

## Cron Jobの確認

```sql
-- 登録されているCron Jobを確認
SELECT * FROM cron.job;

-- 実行履歴を確認
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

## Cron Jobの削除

```sql
-- Job名で削除
SELECT cron.unschedule('daily-line-notifications');
```

## スケジュール例

```
0 11 * * *   # 毎日11:00 UTC (20:00 JST)
0 9 * * *    # 毎日09:00 UTC (18:00 JST)
0 12 * * *   # 毎日12:00 UTC (21:00 JST)
0 */6 * * *  # 6時間ごと
```

## トラブルシューティング

### Cron Jobが実行されない

1. **pg_cron拡張が有効か確認**
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

2. **URLとキーが正しいか確認**
   - プロジェクトREFが正しいか
   - Service Role Keyが正しいか

3. **Edge Functionが動作しているか確認**
   - Dashboard → Edge Functions → send-daily-notifications → Test

### 実行ログの確認

```sql
-- 最新10件の実行結果
SELECT 
  jobid,
  runid,
  job_name,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details 
WHERE job_name = 'daily-line-notifications'
ORDER BY start_time DESC 
LIMIT 10;
```

## 注意事項

- Supabase Freeプランでは、Cron Jobの実行回数に制限がある場合があります
- タイムゾーンはUTCで設定します（JST = UTC+9）
- Edge Functionの実行時間制限に注意してください
