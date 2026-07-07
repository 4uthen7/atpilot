/**
 * 出席オートパイロット ログ記録用 Google Apps Script
 *
 * 【セットアップ手順】
 * 1. Google スプレッドシートを新規作成
 * 2. 拡張機能 → Apps Script を開く
 * 3. このコードを貼り付けて保存
 * 4. デプロイ → 新しいデプロイ → ウェブアプリ
 *    - 実行ユーザー: 自分
 *    - アクセス: 全員
 * 5. 表示されたURLをコピーして index.html の LOG_GAS_URL に設定
 */

const SPREADSHEET_ID = '18-6y_MSpZbXqiYHgpHHk-TDacfy_skm_tG6h-IxaADk';
const SHEET_NAME = '出席ログ';
const GOOGLE_CLIENT_ID = '953188312585-0u7b4eoer9ga3t0ije5gqup1j3t9aam5.apps.googleusercontent.com';
const HEADERS = [
  'タイムスタンプ', '学籍番号', '日付', '時刻', 'OTP',
  'IPアドレス', 'User-Agent', 'プラットフォーム',
  '言語', '全言語', '画面解像度', 'ウィンドウサイズ',
  'ピクセル比', 'タイムゾーン', 'TZオフセット',
  'オンライン', 'Cookie有効', 'CPUコア数', 'メモリ(GB)',
  '接続種別', '下り速度', 'RTT',
  'リファラー', 'タッチ対応', 'ベンダー', 'Unix(ms)',
  'GoogleアカウントID', 'Googleメール', 'Google表示名'
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const user = verifyGoogleToken_(data.idToken);

    if (data.action === 'history') {
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
      return jsonResponse_({ status: 'ok', history: getHistory_(sheet, user.sub) });
    }

    if (data.action && data.action !== 'log') {
      throw new Error('不明な操作です');
    }

    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const sheet = getLogSheet_();
      const cn = data.connection || {};
      sheet.appendRow([
        new Date(),
        data.studentId || '',
        data.date || '',
        data.time || '',
        data.otp || '',
        data.ip || '',
        data.ua || '',
        data.platform || '',
        data.language || '',
        data.languages || '',
        data.screen || '',
        data.windowSize || '',
        data.pixelRatio || '',
        data.timezone || '',
        data.tzOffset != null ? data.tzOffset : '',
        data.online != null ? data.online : '',
        data.cookieEnabled != null ? data.cookieEnabled : '',
        data.cores || '',
        data.memory || '',
        cn.type || '',
        cn.downlink || '',
        cn.rtt || '',
        data.referrer || '',
        data.touchSupport != null ? data.touchSupport : '',
        data.vendor || '',
        data.unixMs || '',
        user.sub,
        user.email || '',
        user.name || ''
      ]);
    } finally {
      if (lock.hasLock()) lock.releaseLock();
    }

    return jsonResponse_({ status: 'ok' });
  } catch (err) {
    return jsonResponse_({ status: 'error', message: err.message || err.toString() });
  }
}

function getLogSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#d9ead3');
  sheet.setFrozenRows(1);
  return sheet;
}

function verifyGoogleToken_(idToken) {
  if (!idToken) throw new Error('Googleログインが必要です');
  if (GOOGLE_CLIENT_ID.indexOf('YOUR_') === 0) {
    throw new Error('Google OAuthクライアントIDが未設定です');
  }

  const digest = Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, idToken)
  );
  const cache = CacheService.getScriptCache();
  const cached = cache.get(digest);
  if (cached) return JSON.parse(cached);

  const response = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken),
    { muteHttpExceptions: true }
  );
  if (response.getResponseCode() !== 200) throw new Error('Googleログインを確認できませんでした');

  const payload = JSON.parse(response.getContentText());
  const validIssuer = payload.iss === 'https://accounts.google.com' || payload.iss === 'accounts.google.com';
  if (payload.aud !== GOOGLE_CLIENT_ID || !validIssuer || String(payload.email_verified) !== 'true') {
    throw new Error('Googleログインの検証に失敗しました');
  }
  if (Number(payload.exp) * 1000 <= Date.now()) throw new Error('ログインの有効期限が切れています');

  const user = {
    sub: payload.sub,
    email: payload.email || '',
    name: payload.name || '',
    picture: payload.picture || ''
  };
  cache.put(digest, JSON.stringify(user), 300);
  return user;
}

function getHistory_(sheet, googleSub) {
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues()
    .filter(row => String(row[26]) === String(googleSub))
    .slice(-100)
    .reverse()
    .map(row => ({
      timestamp: row[0] instanceof Date ? row[0].toISOString() : String(row[0] || ''),
      studentId: String(row[1] || ''),
      date: String(row[2] || ''),
      time: String(row[3] || ''),
      otp: String(row[4] || '')
    }));
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService
    .createTextOutput('出席ログAPI is running')
    .setMimeType(ContentService.MimeType.TEXT);
}
