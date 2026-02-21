// LINE Messaging API ヘルパー関数

/**
 * LINEにメッセージを送信
 * @param {string} lineUserId - LINE User ID
 * @param {string} message - 送信するメッセージ
 * @returns {Promise<boolean>} - 成功したかどうか
 */
async function sendLineMessage(lineUserId, message) {
  if (!CONFIG.LINE_CHANNEL_ACCESS_TOKEN) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN が設定されていません');
    return false;
  }

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{
          type: 'text',
          text: message
        }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('LINE API Error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('送信エラー:', error);
    return false;
  }
}

/**
 * テストメッセージを送信
 * @param {string} lineUserId - LINE User ID
 */
async function sendTestMessage(lineUserId) {
  const message = 'マチアプネキだよ〜！\n連携テスト成功ンゴね〜✨';
  return await sendLineMessage(lineUserId, message);
}
